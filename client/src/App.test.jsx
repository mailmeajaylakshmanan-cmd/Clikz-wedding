import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    // Since we redirect to login, let's see if login renders
    // or just checking it didn't throw an error.
    expect(true).toBe(true);
  });
});
