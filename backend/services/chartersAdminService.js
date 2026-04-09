const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);
const ALLOWED_ACTING_ROLES = new Set(['admin', 'recruiter']);
const HOSTED_CHARTERS_BASE_URL = 'https://charters-business-admin.onrender.com';
const LOCAL_CHARTERS_BASE_URL = 'http://localhost:5000';
const DEFAULT_LOGIN_PATHS = ['/api/v1/auth/login', '/api/auth/login'];

const normalizeBaseUrl = (rawUrl) => {
  const value = String(rawUrl || '').trim();
  return value.replace(/\/$/, '');
};

const getDefaultChartersBaseUrl = () => (
  process.env.NODE_ENV === 'production'
    ? HOSTED_CHARTERS_BASE_URL
    : LOCAL_CHARTERS_BASE_URL
);

const normalizeTimeout = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const isLocalRuntime = () => process.env.NODE_ENV !== 'production';

const REQUEST_TIMEOUT_MS = normalizeTimeout(process.env.CHARTERS_API_TIMEOUT_MS, 5000);
const RETRY_COUNT = normalizeTimeout(process.env.CHARTERS_API_RETRY_COUNT, 2);
const RETRY_BASE_DELAY_MS = normalizeTimeout(process.env.CHARTERS_API_RETRY_DELAY_MS, 200);
const LOGIN_RETRY_COUNT = normalizeTimeout(process.env.CHARTERS_LOGIN_RETRY_COUNT, 1);

const withTunnelPriorityForLocal = (urls) => {
  const unique = Array.from(new Set((urls || []).filter(Boolean)));
  const tunnelUrl = normalizeBaseUrl(process.env.CHARTERS_API_TUNNEL_URL);

  if (!isLocalRuntime() || !tunnelUrl) {
    return unique;
  }

  const withoutTunnel = unique.filter((url) => url !== tunnelUrl);
  return [tunnelUrl, ...withoutTunnel];
};

const getChartersBaseUrl = () => {
  const configuredBaseUrls = withTunnelPriorityForLocal(parseCsvValues(process.env.CHARTERS_API_URLS)
    .map((url) => normalizeBaseUrl(url))
    .filter(Boolean));

  if (configuredBaseUrls.length > 0) {
    return configuredBaseUrls[0];
  }

  const tunnelUrl = normalizeBaseUrl(process.env.CHARTERS_API_TUNNEL_URL);
  if (isLocalRuntime() && tunnelUrl) {
    return tunnelUrl;
  }

  const configuredBaseUrl = normalizeBaseUrl(process.env.CHARTERS_API_URL);
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  return normalizeBaseUrl(getDefaultChartersBaseUrl());
};

const getChartersBaseUrls = () => {
  return withTunnelPriorityForLocal([
    ...parseCsvValues(process.env.CHARTERS_API_URLS),
    process.env.CHARTERS_API_URL,
    process.env.CHARTERS_API_TUNNEL_URL,
    getDefaultChartersBaseUrl(),
  ]
    .map((url) => normalizeBaseUrl(url))
    .filter(Boolean));
};

const getLoginPaths = () => {
  const configuredPaths = parseCsvValues(process.env.CHARTERS_ADMIN_LOGIN_PATHS)
    .map((path) => `/${String(path || '').trim().replace(/^\/+/, '')}`)
    .filter((path) => path !== '/');

  if (configuredPaths.length > 0) {
    return Array.from(new Set(configuredPaths));
  }

  return DEFAULT_LOGIN_PATHS;
};

const parseCsvValues = (value) => String(value || '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

const getServiceKey = () => {
  const keys = [
    ...parseCsvValues(process.env.CHARTERS_SERVICE_KEYS),
    process.env.CHARTERS_SERVICE_KEY,
    process.env.INTERNAL_SERVICE_KEY,
    process.env.SERVICE_KEY,
  ]
    .map((entry) => String(entry || '').trim())
    .filter(Boolean);

  return keys[0] || '';
};

const getSharedSecret = () => (
  process.env.INTERNAL_SHARED_SECRET ||
  process.env.JWT_SECRET ||
  ''
);

const getActingTokenIssuer = () => process.env.INTERNAL_ACTING_TOKEN_ISSUER || 'profile-branding';
const getActingTokenTTL = () => process.env.INTERNAL_ACTING_TOKEN_TTL || '5m';

const splitName = (name = '') => {
  const value = String(name || '').trim();
  if (!value) {
    return { firstName: '', lastName: '' };
  }

  const [firstName, ...rest] = value.split(/\s+/);
  return {
    firstName,
    lastName: rest.join(' '),
  };
};

const normalizeCandidate = (candidate) => {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const rawId = candidate._id || candidate.id;
  if (!rawId) {
    return null;
  }

  const status = candidate.status || (candidate.isActive === false ? 'disabled' : 'active');
  const names = splitName(candidate.name || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim());

  return {
    _id: String(rawId),
    id: String(rawId),
    chartersUserId: String(rawId),
    name: (candidate.name || `${names.firstName} ${names.lastName}`.trim() || null),
    firstName: names.firstName,
    lastName: names.lastName,
    email: candidate.email || null,
    phoneNumber: candidate.phoneNumber || candidate.phone || null,
    courseInterestedIn: candidate.courseInterestedIn || null,
    role: candidate.role || 'user',
    status,
    isActive: status === 'active',
    avatar: candidate.avatar || null,
    createdAt: candidate.createdAt || null,
    updatedAt: candidate.updatedAt || null,
    lastLogin: candidate.lastLogin || null,
  };
};

const extractPayload = (response) => {
  const body = response?.data;
  if (body && typeof body === 'object' && body.data !== undefined) {
    return body.data;
  }

  return body;
};

const normalizeCandidatesPayload = (payload) => {
  const entries = Array.isArray(payload?.candidates) ? payload.candidates : [];
  return {
    ...payload,
    candidates: entries
      .map((candidate) => normalizeCandidate(candidate))
      .filter(Boolean),
  };
};

const toServiceError = (error, fallbackMessage) => {
  const status = error?.status || error?.response?.status || 500;
  const message =
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage;

  const serviceError = new Error(message);
  serviceError.status = status;
  serviceError.details = error?.response?.data || null;
  serviceError.code = error?.code || error?.response?.data?.code || null;
  serviceError.isNetworkError = !error?.response;
  return serviceError;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error) => {
  if (!error?.response) {
    return true;
  }

  const status = error.response.status;
  return status === 429 || status >= 500;
};

const buildRequestId = (candidateId) => {
  const value = String(candidateId || '').trim();
  return value || crypto.randomUUID();
};

const normalizeActorContext = (actorContext) => {
  if (!actorContext || typeof actorContext !== 'object') {
    return {
      adminId: String(actorContext || ''),
      role: 'admin',
      requestId: null,
    };
  }

  return {
    adminId: String(actorContext.adminId || actorContext.chartersUserId || actorContext.actingAdminId || ''),
    role: String(actorContext.role || 'admin').toLowerCase(),
    requestId: actorContext.requestId || null,
  };
};

const createActingAdminToken = (actorContext) => {
  const context = normalizeActorContext(actorContext);
  if (!context.adminId) {
    throw new Error('Acting admin id is required for Charters internal calls');
  }

  if (!ALLOWED_ACTING_ROLES.has(context.role)) {
    throw new Error('Acting admin role must be admin or recruiter');
  }

  const sharedSecret = getSharedSecret();
  if (!sharedSecret) {
    throw new Error('INTERNAL_SHARED_SECRET is not configured in Profile-Branding backend');
  }

  return jwt.sign(
    {
      adminId: context.adminId,
      role: context.role,
    },
    sharedSecret,
    {
      issuer: getActingTokenIssuer(),
      expiresIn: getActingTokenTTL(),
    }
  );
};

const createClient = (actorContext, includeServiceHeaders = true, baseURL = getChartersBaseUrl()) => {
  const context = normalizeActorContext(actorContext);

  const headers = {
    'Content-Type': 'application/json',
    'x-request-id': buildRequestId(context.requestId),
  };

  if (includeServiceHeaders) {
    const serviceKey = getServiceKey();
    if (!serviceKey) {
      throw new Error('CHARTERS_SERVICE_KEY (or CHARTERS_SERVICE_KEYS) is not configured in Profile-Branding backend');
    }

    headers['x-service-key'] = serviceKey;
    headers['x-acting-admin-token'] = createActingAdminToken(context);
  }

  return axios.create({
    baseURL,
    timeout: REQUEST_TIMEOUT_MS,
    headers,
  });
};

const requestWithRetry = async (client, method, url, requestConfig = {}) => {
  const normalizedMethod = String(method || 'get').toLowerCase();
  const canRetry = RETRYABLE_METHODS.has(normalizedMethod);
  const maxRetries = canRetry ? RETRY_COUNT : 0;

  let attempt = 0;
  while (true) {
    try {
      return await client.request({
        method: normalizedMethod,
        url,
        ...requestConfig,
      });
    } catch (error) {
      if (!canRetry || attempt >= maxRetries || !isRetryableError(error)) {
        throw error;
      }

      attempt += 1;
      await sleep(RETRY_BASE_DELAY_MS * attempt);
    }
  }
};

const chartersAdminService = {
  async loginAdmin(email, password, requestContext = {}) {
    const baseUrls = getChartersBaseUrls();
    const loginPaths = getLoginPaths();
    let lastError = null;

    for (const baseURL of baseUrls) {
      const client = createClient(requestContext, false, baseURL);

      for (const loginPath of loginPaths) {
        let retryAttempt = 0;

        while (true) {
          try {
            const response = await client.request({
              method: 'post',
              url: loginPath,
              data: { email, password },
            });

            const payload = extractPayload(response) || {};
            const user = payload.user || response?.data?.user;

            if (!user || !user.id) {
              throw new Error('Invalid login response from Charters');
            }

            if (!ALLOWED_ACTING_ROLES.has(String(user.role || '').toLowerCase())) {
              const forbidden = new Error('Admin access required');
              forbidden.status = 403;
              throw forbidden;
            }

            return {
              user,
              token: payload.token || response?.data?.token || null,
            };
          } catch (error) {
            lastError = error;
            const status = error?.response?.status;
            const noResponse = !error?.response;
            const canRetryCurrentTarget =
              (noResponse || status === 429 || status >= 500) &&
              retryAttempt < LOGIN_RETRY_COUNT;

            if (canRetryCurrentTarget) {
              retryAttempt += 1;
              await sleep(RETRY_BASE_DELAY_MS * retryAttempt);
              continue;
            }

            if (status === 404 || noResponse || status >= 500) {
              break;
            }

            throw toServiceError(error, 'Failed to validate admin credentials with Charters');
          }
        }
      }
    }

    throw toServiceError(lastError || new Error('Upstream login service unavailable'), 'Failed to validate admin credentials with Charters');
  },

  async getCandidates(actorContext, params = {}) {
    try {
      const client = createClient(actorContext);
      const response = await requestWithRetry(client, 'get', '/api/internal/admin/candidates', { params });
      return normalizeCandidatesPayload(extractPayload(response) || {});
    } catch (error) {
      throw toServiceError(error, 'Failed to fetch candidates from Charters');
    }
  },

  async getCandidateById(actorContext, chartersUserId) {
    try {
      const client = createClient(actorContext);
      const response = await requestWithRetry(client, 'get', `/api/internal/admin/candidates/${chartersUserId}`);
      return normalizeCandidate(extractPayload(response));
    } catch (error) {
      throw toServiceError(error, 'Failed to fetch candidate from Charters');
    }
  },

  async updateCandidateStatus(actorContext, chartersUserId, status) {
    try {
      const client = createClient(actorContext);
      const response = await requestWithRetry(client, 'patch', `/api/internal/admin/candidates/${chartersUserId}/status`, {
        data: { status },
      });
      return normalizeCandidate(extractPayload(response));
    } catch (error) {
      throw toServiceError(error, 'Failed to update candidate status in Charters');
    }
  },

  async deactivateCandidate(actorContext, chartersUserId) {
    try {
      const client = createClient(actorContext);
      const response = await requestWithRetry(client, 'patch', `/api/internal/admin/candidates/${chartersUserId}/deactivate`, {
        data: {},
      });
      return normalizeCandidate(extractPayload(response));
    } catch (error) {
      throw toServiceError(error, 'Failed to deactivate candidate in Charters');
    }
  },

  async getJobs(actorContext, params = {}) {
    try {
      const client = createClient(actorContext);
      const response = await requestWithRetry(client, 'get', '/api/internal/admin/jobs', { params });
      return extractPayload(response) || {};
    } catch (error) {
      throw toServiceError(error, 'Failed to fetch jobs from Charters');
    }
  },

  async getJobById(actorContext, id) {
    try {
      const client = createClient(actorContext);
      const response = await requestWithRetry(client, 'get', `/api/internal/admin/jobs/${id}`);
      return extractPayload(response);
    } catch (error) {
      throw toServiceError(error, 'Failed to fetch job from Charters');
    }
  },

  async createJob(actorContext, payload) {
    try {
      const client = createClient(actorContext);
      const response = await requestWithRetry(client, 'post', '/api/internal/admin/jobs', {
        data: payload,
      });
      return extractPayload(response);
    } catch (error) {
      throw toServiceError(error, 'Failed to create job in Charters');
    }
  },

  async updateJob(actorContext, id, payload) {
    try {
      const client = createClient(actorContext);
      const response = await requestWithRetry(client, 'patch', `/api/internal/admin/jobs/${id}`, {
        data: payload,
      });
      return extractPayload(response);
    } catch (error) {
      throw toServiceError(error, 'Failed to update job in Charters');
    }
  },

  async deleteJob(actorContext, id) {
    try {
      const client = createClient(actorContext);
      const response = await requestWithRetry(client, 'delete', `/api/internal/admin/jobs/${id}`);
      return extractPayload(response);
    } catch (error) {
      throw toServiceError(error, 'Failed to delete job in Charters');
    }
  },

  async getInternships(actorContext, params = {}) {
    try {
      const client = createClient(actorContext);
      const response = await requestWithRetry(client, 'get', '/api/internal/admin/internships', { params });
      return extractPayload(response) || {};
    } catch (error) {
      throw toServiceError(error, 'Failed to fetch internships from Charters');
    }
  },

  async getInternshipById(actorContext, id) {
    try {
      const client = createClient(actorContext);
      const response = await requestWithRetry(client, 'get', `/api/internal/admin/internships/${id}`);
      return extractPayload(response);
    } catch (error) {
      throw toServiceError(error, 'Failed to fetch internship from Charters');
    }
  },

  async createInternship(actorContext, payload) {
    try {
      const client = createClient(actorContext);
      const response = await requestWithRetry(client, 'post', '/api/internal/admin/internships', {
        data: payload,
      });
      return extractPayload(response);
    } catch (error) {
      throw toServiceError(error, 'Failed to create internship in Charters');
    }
  },

  async updateInternship(actorContext, id, payload) {
    try {
      const client = createClient(actorContext);
      const response = await requestWithRetry(client, 'patch', `/api/internal/admin/internships/${id}`, {
        data: payload,
      });
      return extractPayload(response);
    } catch (error) {
      throw toServiceError(error, 'Failed to update internship in Charters');
    }
  },

  async deleteInternship(actorContext, id) {
    try {
      const client = createClient(actorContext);
      const response = await requestWithRetry(client, 'delete', `/api/internal/admin/internships/${id}`);
      return extractPayload(response);
    } catch (error) {
      throw toServiceError(error, 'Failed to delete internship in Charters');
    }
  },

  async getApplications(actorContext, params = {}) {
    try {
      const client = createClient(actorContext);
      const response = await requestWithRetry(client, 'get', '/api/internal/admin/applications', { params });
      return extractPayload(response) || {};
    } catch (error) {
      throw toServiceError(error, 'Failed to fetch applications from Charters');
    }
  },

  async getApplicationsForJob(actorContext, jobId, params = {}) {
    try {
      const client = createClient(actorContext);
      const response = await requestWithRetry(client, 'get', `/api/internal/admin/jobs/${jobId}/applications`, { params });
      return extractPayload(response) || {};
    } catch (error) {
      throw toServiceError(error, 'Failed to fetch job applications from Charters');
    }
  },

  async getApplicationsForInternship(actorContext, internshipId, params = {}) {
    try {
      const client = createClient(actorContext);
      const response = await requestWithRetry(client, 'get', `/api/internal/admin/internships/${internshipId}/applications`, { params });
      return extractPayload(response) || {};
    } catch (error) {
      throw toServiceError(error, 'Failed to fetch internship applications from Charters');
    }
  },

  async updateApplicationStatus(actorContext, applicationId, status) {
    try {
      const client = createClient(actorContext);
      const response = await requestWithRetry(client, 'patch', `/api/internal/admin/applications/${applicationId}/status`, {
        data: { status },
      });
      return extractPayload(response);
    } catch (error) {
      throw toServiceError(error, 'Failed to update application status in Charters');
    }
  },
};

module.exports = chartersAdminService;
