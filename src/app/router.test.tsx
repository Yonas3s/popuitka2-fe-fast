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
  });

  it('renders landing page', async () => {
    renderRoute('/');

    expect(await screen.findByRole('heading', { name: 'Попутка v2' })).toBeInTheDocument();
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

  it('renders not found page', async () => {
    renderRoute('/unknown-route');

    expect(await screen.findByText('404')).toBeInTheDocument();
  });
});
