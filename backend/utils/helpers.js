// Format date to readable string
exports.formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Sanitize URL
exports.sanitizeUrl = (url) => {
  if (!url) return null;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
};

// Calculate percentage
exports.calculatePercentage = (value, max) => {
  if (!max || max === 0) return 0;
  return Math.min(100, Math.round((value / max) * 100));
};

// Truncate text
exports.truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Validate URL format
exports.isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validate GitHub username
exports.isValidGithubUsername = (username) => {
  const githubUsernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
  return githubUsernameRegex.test(username);
};

// Validate LinkedIn URL
exports.isValidLinkedInUrl = (url) => {
  return url.includes('linkedin.com/in/');
};

// Get score level label
exports.getScoreLevel = (score) => {
  if (score >= 76) return { level: 'Expert',  color: '#22c55e' };
  if (score >= 51) return { level: 'Strong',  color: '#3b82f6' };
  if (score >= 26) return { level: 'Growing', color: '#f59e0b' };
  return               { level: 'Beginner', color: '#ef4444' };
};

// Generate a random avatar color based on name
exports.getAvatarColor = (name) => {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// Sleep utility for rate limiting
exports.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Paginate an array
exports.paginate = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex   = page * limit;
  return {
    data: array.slice(startIndex, endIndex),
    total: array.length,
    page,
    totalPages: Math.ceil(array.length / limit),
    hasNext: endIndex < array.length,
    hasPrev: startIndex > 0
  };
};