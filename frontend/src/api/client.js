const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('reviewer_ai_token');
}

async function request(method, path, body, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (opts.headers) Object.assign(headers, opts.headers);

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: opts.signal,
  });

  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = { message: await res.text() };
  }

  if (!res.ok) {
    const err = new Error(data.error || data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  get: (path, opts) => request('GET', path, undefined, opts),
  post: (path, body, opts) => request('POST', path, body, opts),
  put: (path, body, opts) => request('PUT', path, body, opts),
  delete: (path, opts) => request('DELETE', path, undefined, opts),

  // Auth
  login: (credentials) => request('POST', '/api/auth/login', credentials),
  register: (data) => request('POST', '/api/auth/register', data),

  // Questions
  getRandomQuestion: (filters) => {
    const params = new URLSearchParams(filters || {}).toString();
    return request('GET', `/api/questions/random${params ? `?${params}` : ''}`);
  },
  getQuestions: () => request('GET', '/api/questions'),

  // Interviews
  submitInterview: (data) => request('POST', '/api/interviews', data),
  getUserInterviews: (userId) => request('GET', `/api/interviews/user/${userId}`),

  // Users
  updateUser: (userId, data) => request('PUT', `/api/users/${userId}`, data),
  getUser: (userId) => request('GET', `/api/users/${userId}`),
  analyzeUser: (userId, interviews) => request('POST', `/api/users/${userId}/analyze`, { interviews }),
};
