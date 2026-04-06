import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
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

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
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

