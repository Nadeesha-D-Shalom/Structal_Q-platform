import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

jest.mock('./services/timetableService', () => ({
  getTimetable: jest.fn(() => Promise.resolve({ data: [] })),
}));

test('renders default timetable view', async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText(/Exam Timetable Management/i)).toBeInTheDocument();
  });
});
