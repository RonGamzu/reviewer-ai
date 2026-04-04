// Mock for @google/generative-ai — prevents real Gemini API calls during tests.
const mockGenerateContent = jest.fn().mockResolvedValue({
  response: {
    text: () => JSON.stringify({
      score: 85,
      feedback: 'Good answer. Consider elaborating on trade-offs.',
    }),
  },
});

const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGenerateContent,
});

function GoogleGenerativeAI() {
  return { getGenerativeModel: mockGetGenerativeModel };
}

module.exports = {
  GoogleGenerativeAI,
  _mockGenerateContent: mockGenerateContent,
  _mockGetGenerativeModel: mockGetGenerativeModel,
};
