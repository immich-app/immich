import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { login } from '@immich/sdk';
import { vi } from 'vitest';
import LoginPage from './+page.svelte';

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

vi.mock('$lib/managers/server-config-manager.svelte', () => ({
  serverConfigManager: {
    value: {
      isInitialized: true,
      isOnboarded: true,
      loginPageMessage: '',
      oauthButtonText: 'OAuth',
    },
    loadServerConfig: vi.fn(),
  },
}));

vi.mock('$lib/managers/feature-flags-manager.svelte', () => ({
  featureFlagsManager: {
    value: {
      oauth: false,
      passwordLogin: true,
      oauthAutoLaunch: false,
    },
    loadFeatureFlags: vi.fn(),
    init: vi.fn(),
  },
}));

vi.mock('$lib/managers/event-manager.svelte', () => ({
  eventManager: {
    emit: vi.fn(),
  },
}));

vi.mock('$lib/managers/auth-manager.svelte', () => ({
  authManager: {
    isSharedLink: false,
  },
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn((cb: (value: unknown) => void) => {
      cb({
        url: new URL('http://localhost:2283/auth/login'),
        params: {},
        route: { id: 'auth/login' },
        status: 200,
        error: null,
        data: {},
        form: undefined,
        state: {},
      });
      return () => {};
    }),
  },
}));

const getData = () => ({
  meta: { title: 'Login' },
  continueUrl: '/photos',
});

describe('Login page validation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should show email required error when email is empty', async () => {
    render(LoginPage, { props: { data: getData() } });

    const passwordInput = screen.getByLabelText(/password/i);
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /to_login/i });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/email is required/i);
    });

    expect(login).not.toHaveBeenCalled();
  });

  it('should show error for email without @ symbol', async () => {
    render(LoginPage, { props: { data: getData() } });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await fireEvent.input(emailInput, { target: { value: 'invalid-email' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /to_login/i });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/incorrect email or password/i);
    });

    expect(login).not.toHaveBeenCalled();
  });

  it('should show password required error when password is empty', async () => {
    render(LoginPage, { props: { data: getData() } });

    const emailInput = screen.getByLabelText(/email/i);
    await fireEvent.input(emailInput, { target: { value: 'user@example.com' } });

    const submitButton = screen.getByRole('button', { name: /to_login/i });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/password required/i);
    });

    expect(login).not.toHaveBeenCalled();
  });

  it('should call login API when both email and password are valid', async () => {
    vi.mocked(login).mockResolvedValueOnce({
      id: 'user-id',
      email: 'user@example.com',
      name: 'Test User',
      isAdmin: false,
      shouldChangePassword: false,
      isOnboarded: true,
    } as never);

    render(LoginPage, { props: { data: getData() } });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await fireEvent.input(emailInput, { target: { value: 'user@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /to_login/i });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        loginCredentialDto: { email: 'user@example.com', password: 'password123' },
      });
    });
  });
});
