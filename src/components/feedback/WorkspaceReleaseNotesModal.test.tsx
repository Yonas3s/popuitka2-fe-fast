import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import {
  getWorkspaceReleaseStorageKey,
  WORKSPACE_RELEASE,
} from '../../lib/config/workspace-release';
import { WorkspaceReleaseNotesModal } from './WorkspaceReleaseNotesModal';

const renderModal = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <WorkspaceReleaseNotesModal />
    </MemoryRouter>,
  );

describe('WorkspaceReleaseNotesModal', () => {
  const storageKey = getWorkspaceReleaseStorageKey(WORKSPACE_RELEASE.id);

  beforeEach(() => {
    useAuthStore.setState({
      token: 'jwt-token',
      user: null,
      isAuthenticated: true,
      hydrated: true,
      meLoading: false,
      meLoaded: false,
    });
  });

  it('shows on workspace routes for authenticated users', () => {
    renderModal('/projects');

    expect(
      screen.getByRole('dialog', { name: 'Что нового в рабочей зоне' }),
    ).toBeInTheDocument();
  });

  it('does not show on landing', () => {
    renderModal('/');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stores dismissal and stays closed on next render', () => {
    const firstRender = renderModal('/teams');

    fireEvent.click(screen.getByRole('button', { name: 'Понятно' }));

    expect(localStorage.getItem(storageKey)).toBeTruthy();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    firstRender.unmount();
    renderModal('/teams');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
