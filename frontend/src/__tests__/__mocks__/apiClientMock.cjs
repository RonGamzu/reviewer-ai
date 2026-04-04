// Global mock for api/client.js — avoids import.meta.env (Vite-only) in Jest
const api = {
  getUserInterviews: jest.fn().mockResolvedValue([]),
  analyzeUser: jest.fn().mockResolvedValue({ analysis: '' }),
  login: jest.fn(),
  register: jest.fn(),
  getRandomQuestion: jest.fn(),
  getQuestions: jest.fn(),
  submitInterview: jest.fn(),
  updateUser: jest.fn(),
  getUser: jest.fn(),
};

module.exports = { api };
