import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './router';
import { useAuthStore } from '../store/auth.store';

const renderRoute = (path: string) => {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
};

describe('router smoke', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, isAuthenticated: false });
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('renders landing page', async () => {
    renderRoute('/');

    expect(await screen.findByRole('heading', { name: 'Popuitkav2' })).toBeInTheDocument();
  });

  it('redirects unauthorized user from private route to signin', async () => {
    renderRoute('/projects');

    expect(await screen.findByRole('heading', { name: 'Вход' })).toBeInTheDocument();
  });

  it('renders private projects route for authenticated user', async () => {
    useAuthStore.setState({ token: 'jwt-token', isAuthenticated: true });
    renderRoute('/projects');

    expect(await screen.findByRole('heading', { name: 'Проекты' })).toBeInTheDocument();
  });

  it('renders private admin route for authenticated user', async () => {
    useAuthStore.setState({ token: 'jwt-token', isAuthenticated: true });
    renderRoute('/admin');

    expect(await screen.findByRole('heading', { name: 'Админ-панель' })).toBeInTheDocument();
  });

  it('renders not found page', async () => {
    renderRoute('/unknown-route');

    expect(await screen.findByText('404')).toBeInTheDocument();
  });

  it('completes oauth callback and redirects to projects', async () => {
    window.history.replaceState({}, '', '/auth/callback?token=oauth-jwt');
    renderRoute('/auth/callback');

    expect(await screen.findByRole('heading', { name: 'Проекты' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('oauth-jwt');
    expect(useAuthStore.getState().token).toBe('oauth-jwt');
  });

  it('redirects to signin when oauth callback has no token', async () => {
    window.history.replaceState({}, '', '/auth/callback');
    renderRoute('/auth/callback');

    expect(await screen.findByRole('heading', { name: 'Вход' })).toBeInTheDocument();
  });
});
