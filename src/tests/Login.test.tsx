import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Login from '../pages/Login';
import { AppProvider } from '../context/AppContext';

describe('Login Component', () => {
  it('renders login form with email and password fields', () => {
    render(
      <BrowserRouter>
        <AppProvider>
          <Login />
        </AppProvider>
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/admin@ticketliv.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('navigates to dashboard on successful login click', () => {
    render(
      <BrowserRouter>
        <AppProvider>
          <Login />
        </AppProvider>
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText(/admin@ticketliv.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const loginButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'admin@ticketliv.com' } });
    fireEvent.change(passwordInput, { target: { value: 'admin' } });
    fireEvent.click(loginButton);

    // After clicking, it should navigate (verified by window location in a real app, 
    // but here we just check that the flow doesn't crash)
    expect(window.location.pathname).toBe('/dashboard');
  });
});
