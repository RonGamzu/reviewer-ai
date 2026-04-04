import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../views/Dashboard';
import { api } from '../api/client.js';  // resolves to apiClientMock.cjs via moduleNameMapper

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser', profession: 'Developer', tech_stack: ['React'] },
  }),
}));

jest.mock('../components/Layout/Sidebar.jsx', () => () => null);
jest.mock('../components/ShareModal.jsx', () => () => null);

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

const makeInterview = (id, overrides = {}) => ({
  id,
  user_id: 1,
  question_id: id,
  question_title: `Question ${id}`,
  category: 'JavaScript',
  difficulty: 'Mid',
  user_answer: 'My answer',
  ai_score: 75,
  ai_feedback: 'Good answer',
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Dashboard – empty state', () => {
  beforeEach(() => {
    api.getUserInterviews.mockResolvedValue([]);
  });

  test('shows empty state message when no interviews', async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/No interviews completed yet/)).toBeInTheDocument()
    );
  });

  test('shows start interview link', async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /Start Mock Interview/i })).toBeInTheDocument()
    );
  });
});

describe('Dashboard – interview list', () => {
  test('renders interview items', async () => {
    api.getUserInterviews.mockResolvedValue([makeInterview(1), makeInterview(2)]);
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Question 1')).toBeInTheDocument());
    expect(screen.getByText('Question 2')).toBeInTheDocument();
  });

  test('shows score for each interview', async () => {
    api.getUserInterviews.mockResolvedValue([makeInterview(1, { ai_score: 88 })]);
    renderDashboard();
    await waitFor(() => expect(screen.getByText('88/100')).toBeInTheDocument());
  });

  test('shows "No score" for unscored interviews', async () => {
    api.getUserInterviews.mockResolvedValue([makeInterview(1, { ai_score: null })]);
    renderDashboard();
    await waitFor(() => expect(screen.getByText('No score')).toBeInTheDocument());
  });
});

describe('Dashboard – pagination', () => {
  test('no pagination for 8 or fewer interviews', async () => {
    api.getUserInterviews.mockResolvedValue(
      Array.from({ length: 8 }, (_, i) => makeInterview(i + 1))
    );
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Question 1')).toBeInTheDocument());
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
  });

  test('pagination appears for 9+ interviews', async () => {
    api.getUserInterviews.mockResolvedValue(
      Array.from({ length: 9 }, (_, i) => makeInterview(i + 1))
    );
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('pagination')).toBeInTheDocument());
  });

  test('only 8 items shown on first page', async () => {
    api.getUserInterviews.mockResolvedValue(
      Array.from({ length: 9 }, (_, i) => makeInterview(i + 1))
    );
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Question 1')).toBeInTheDocument());
    expect(screen.queryByText('Question 9')).not.toBeInTheDocument();
  });

  test('clicking Next shows the next page items', async () => {
    api.getUserInterviews.mockResolvedValue(
      Array.from({ length: 9 }, (_, i) => makeInterview(i + 1))
    );
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Question 1')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next page/i }));
    expect(screen.getByText('Question 9')).toBeInTheDocument();
    expect(screen.queryByText('Question 1')).not.toBeInTheDocument();
  });

  test('clicking Prev goes back to previous page', async () => {
    api.getUserInterviews.mockResolvedValue(
      Array.from({ length: 9 }, (_, i) => makeInterview(i + 1))
    );
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Question 1')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next page/i }));
    expect(screen.getByText('Question 9')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Previous page/i }));
    expect(screen.getByText('Question 1')).toBeInTheDocument();
  });

  test('Prev button is disabled on first page', async () => {
    api.getUserInterviews.mockResolvedValue(
      Array.from({ length: 9 }, (_, i) => makeInterview(i + 1))
    );
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('pagination')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Previous page/i })).toBeDisabled();
  });

  test('Next button is disabled on last page', async () => {
    api.getUserInterviews.mockResolvedValue(
      Array.from({ length: 9 }, (_, i) => makeInterview(i + 1))
    );
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('pagination')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next page/i }));
    expect(screen.getByRole('button', { name: /Next page/i })).toBeDisabled();
  });

  test('clicking a page number navigates to that page', async () => {
    api.getUserInterviews.mockResolvedValue(
      Array.from({ length: 17 }, (_, i) => makeInterview(i + 1))
    );
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('pagination')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(screen.getByText('Question 9')).toBeInTheDocument();
    expect(screen.queryByText('Question 1')).not.toBeInTheDocument();
  });
});

describe('Dashboard – XP display', () => {
  test('shows XP based on scores', async () => {
    api.getUserInterviews.mockResolvedValue([makeInterview(1, { ai_score: 80 })]);
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/1,200 XP/)).toBeInTheDocument());
  });

  test('shows level 1 for new user with no interviews', async () => {
    api.getUserInterviews.mockResolvedValue([]);
    renderDashboard();
    // Level 1 badge in the hero section
    await waitFor(() => {
      const levelBadges = screen.getAllByText('1');
      expect(levelBadges.length).toBeGreaterThan(0);
    });
  });
});
