import axios from 'axios';
import toast from 'react-hot-toast';

const HOSTED_API_BASE_URL = 'https://charters-business-admin.onrender.com/api';
const LOCAL_API_BASE_URL = 'http://localhost:5000/api';

const resolveApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = String(window.location?.hostname || '').toLowerCase();
    
    // Check if the hostname is a local address
    const isLocal = hostname === 'localhost' || 
                   hostname === '127.0.0.1' || 
                   /^192\.168\.\d+\.\d+$/.test(hostname) ||
                   /^10\.\d+\.\d+\.\d+$/.test(hostname);

    if (isLocal) {
      // Use the same hostname but port 5000 for the local backend
      return `http://${hostname}:5000/api`;
    }
  }

  const configuredBaseUrl = String(process.env.REACT_APP_API_URL || '').trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  return HOSTED_API_BASE_URL;
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30000
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    // Only use sessionStorage for auth token (cleared when tab is closed).
    const token = (typeof window !== 'undefined' && sessionStorage.getItem('token'));
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    const requestUrl = error.config?.url || '';

    const isAuthRequest = ['/auth/login', '/auth/register', '/admin/auth/login'].some((path) => requestUrl.includes(path));

    if (error.response?.status === 401 && !isAuthRequest) {
      sessionStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error.response?.status === 429 && !requestUrl.includes('/profile-branding/github/fetch')) {
      toast.error('Too many requests. Please slow down.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject({ ...error, message });
  }
);

export default api;


// ─── Profile Branding Service ─────────────────────────────────────
export const profileService = {
  getScore:           ()       => api.get('/profile-branding/score'),
  calculateScore:     ()       => api.post('/profile-branding/calculate'),
  getScoreHistory:    ()       => api.get('/profile-branding/score-history'),
  updateWebsite:      (data)   => api.put('/profile-branding/personal-website', data),
  updateLinkedIn:     (data)   => api.put('/profile-branding/linkedin', data),
  scrapeLinkedIn:     (data)   => api.post('/profile-branding/linkedin/scrape', data),
  getScrapeJob:       (jobId)   => api.get(`/profile-branding/linkedin/scrape/${jobId}`),
  fetchGitHub:        (data)   => api.post('/profile-branding/github/fetch', data),
  analyzeYouTube:     (data)   => api.post('/profile-branding/youtube/analyze', data),
  updateNetworking:   (data)   => api.put('/profile-branding/networking', data),
  addCertification:   (data)   => api.post('/profile-branding/certifications', data),
  deleteCertification:(id)     => api.delete(`/profile-branding/certifications/${id}`),
  addCourse:          (data)   => api.post('/profile-branding/courses', data),
  deleteCourse:       (id)     => api.delete(`/profile-branding/courses/${id}`),
  addPublication:     (data)   => api.post('/profile-branding/publications', data),
  deletePublication:  (id)     => api.delete(`/profile-branding/publications/${id}`),
  completeSuggestion: (id)     => api.put(`/profile-branding/suggestions/${id}/complete`)
};

// ─── AI Services ──────────────────────────────────────────────────
export const aiService = {
  improveHeadline:    (data)   => api.post('/ai-services/improve-headline', data),
  improveAbout:       (data)   => api.post('/ai-services/improve-about', data),
  checkGrammar:       (data)   => api.post('/ai-services/check-grammar', data),
  generateSuggestions:(data)   => api.post('/ai-services/generate-suggestions', data),
  extractCertificateText:(file) => {
    const form = new FormData();
    form.append('certificate', file);
    return api.post('/ai-services/extract-certificate-text', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  parseResume:        (file)   => {
    const form = new FormData();
    form.append('resume', file);
    return api.post('/ai-services/parse-resume', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  analyzeProfilePicture:(file) => {
    const form = new FormData();
    form.append('profilePicture', file);
    return api.post('/ai-services/analyze-profile-picture', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const aiInterviewService = {
  getHealth: () => requestWithFallback(
    [
      () => api.get('/ai-interview/health'),
      () => api.get('/interview/health')
    ],
    'AI interview health endpoint is not available on this backend.'
  ),

  getToken: (roomId) => requestWithFallback(
    [
      () => api.get('/ai-interview/token', { params: { roomId } }),
      () => api.get('/interview/token', { params: { roomId } }),
      () => api.post('/ai-interview/token', { roomId }),
      () => api.post('/interview/token', { roomId })
    ],
    'AI interview token endpoint is not available on this backend.'
  ),

  scoreLanguage: (text) => requestWithFallback(
    [
      () => api.post('/ai-interview/score-language', { text }),
      () => api.post('/interview/score-language', { text })
    ],
    'AI interview language scoring endpoint is not available on this backend.'
  )
};

const isNotFound = (error) => error?.response?.status === 404;

const requestWithFallback = async (requests, fallbackMessage) => {
  let lastError = null;

  for (const request of requests) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
      if (!isNotFound(error)) {
        throw error;
      }
    }
  }

  const message = lastError?.response?.data?.message || lastError?.message || fallbackMessage;
  throw new Error(message);
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const getCollectionFromResponse = (response, keys = []) => {
  const payload = response?.data || {};
  for (const key of keys) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  return Array.isArray(payload) ? payload : [];
};

const getObjectFromResponse = (response, keys = []) => {
  const payload = response?.data || {};
  for (const key of keys) {
    if (payload[key] && typeof payload[key] === 'object' && !Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload;
  }

  return null;
};

export const recruitmentAdminService = {
  getMyJobPostings: async () => {
    const response = await api.get('/admin/jobs/my-postings');
    return toArray(getCollectionFromResponse(response, ['jobPostings', 'jobs', 'data']));
  },

  getAllJobPostings: async (params = {}) => {
    const response = await api.get('/admin/jobs', { params });
    return toArray(getCollectionFromResponse(response, ['jobPostings', 'jobs', 'data']));
  },

  getJobById: async (id) => {
    const response = await api.get(`/admin/jobs/${id}`);
    return getObjectFromResponse(response, ['jobPosting', 'job', 'data']);
  },

  createJobPosting: async (payload) => {
    const response = await api.post('/admin/jobs', payload);
    return response.data;
  },

  updateJobPosting: async (id, payload) => {
    const response = await api.put(`/admin/jobs/${id}`, payload);
    return response.data;
  },

  deleteJobPosting: async (id) => {
    const response = await api.delete(`/admin/jobs/${id}`);
    return response.data;
  },

  getApplicationsForJob: async (jobId, params = {}) => {
    const response = await api.get(`/admin/jobs/${jobId}/applications`, { params });
    return toArray(getCollectionFromResponse(response, ['applications', 'jobApplications', 'data']));
  },

  getMyInternshipPostings: async () => {
    const response = await api.get('/admin/internships/my-postings');
    return toArray(getCollectionFromResponse(response, ['internshipPostings', 'internships', 'data']));
  },

  getAllInternshipPostings: async (params = {}) => {
    const response = await api.get('/admin/internships', { params });
    return toArray(getCollectionFromResponse(response, ['internshipPostings', 'internships', 'data']));
  },

  getInternshipById: async (id) => {
    const response = await api.get(`/admin/internships/${id}`);
    return getObjectFromResponse(response, ['internshipPosting', 'internship', 'data']);
  },

  createInternshipPosting: async (payload) => {
    const response = await api.post('/admin/internships', payload);
    return response.data;
  },

  updateInternshipPosting: async (id, payload) => {
    const response = await api.put(`/admin/internships/${id}`, payload);
    return response.data;
  },

  deleteInternshipPosting: async (id) => {
    const response = await api.delete(`/admin/internships/${id}`);
    return response.data;
  },

  getApplicationsForInternship: async (internshipId, params = {}) => {
    const response = await api.get(`/admin/internships/${internshipId}/applications`, { params });
    return toArray(getCollectionFromResponse(response, ['applications', 'internshipApplications', 'data']));
  },

  updateApplicationStatus: async (applicationId, status) => {
    const response = await api.patch(`/admin/applications/${applicationId}/status`, { status });
    return response.data;
  }
};


