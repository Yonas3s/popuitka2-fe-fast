import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { GuestOnly, RequireAuth } from './guards';
import { LandingPage } from '../pages/LandingPage';
import { AboutPage } from '../pages/AboutPage';
import { SignInPage } from '../pages/SignInPage';
import { SignUpPage } from '../pages/SignUpPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { VerifyResetCodePage } from '../pages/VerifyResetCodePage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { AuthCallbackPage } from '../pages/AuthCallbackPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PixelDuck } from '../components/duck/PixelDuck';

// Heavy authenticated pages — split them into separate bundles so the first
// paint (landing + auth) stays small and subsequent routes load on demand.
const ProjectsPage = lazy(() => import('../pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const ProjectDetailsPage = lazy(() => import('../pages/ProjectDetailsPage').then((m) => ({ default: m.ProjectDetailsPage })));
const StageDetailsPage = lazy(() => import('../pages/StageDetailsPage').then((m) => ({ default: m.StageDetailsPage })));
const AgentPage = lazy(() => import('../pages/AgentPage').then((m) => ({ default: m.AgentPage })));
const PublicClientPage = lazy(() => import('../pages/PublicClientPage').then((m) => ({ default: m.PublicClientPage })));
const TeamsPage = lazy(() => import('../pages/TeamsPage').then((m) => ({ default: m.TeamsPage })));
const TeamDetailsPage = lazy(() => import('../pages/TeamDetailsPage').then((m) => ({ default: m.TeamDetailsPage })));
const TeamInvitePage = lazy(() => import('../pages/TeamInvitePage').then((m) => ({ default: m.TeamInvitePage })));
const AdminPage = lazy(() => import('../pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const ProfileSettingsPage = lazy(() => import('../pages/ProfileSettingsPage').then((m) => ({ default: m.ProfileSettingsPage })));
const GitHubSettingsFullPage = lazy(() => import('../pages/GitHubSettingsFullPage').then((m) => ({ default: m.GitHubSettingsFullPage })));
const TelegramSettingsPage = lazy(() => import('../pages/TelegramSettingsPage').then((m) => ({ default: m.TelegramSettingsPage })));
const GitHubCallbackInstallPage = lazy(() => import('../pages/GitHubCallbackInstallPage').then((m) => ({ default: m.GitHubCallbackInstallPage })));

const RouteFallback = () => (
  <div className="route-fallback" role="status" aria-live="polite">
    <div className="route-fallback-duck">
      <PixelDuck mood="thinking" />
    </div>
    <span className="route-fallback-text">Загрузка…</span>
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />

        <Route element={<GuestOnly />}>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-reset-code" element={<VerifyResetCodePage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/team-invite" element={<TeamInvitePage />} />
        <Route path="/team-invites" element={<TeamInvitePage />} />
        <Route path="/team-invite/:token" element={<TeamInvitePage />} />
        <Route path="/team-invites/:token" element={<TeamInvitePage />} />

        <Route path="/github/callback/install" element={<GitHubCallbackInstallPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/settings" element={<ProfileSettingsPage />} />
          <Route path="/settings/tokens" element={<SettingsPage />} />
          <Route path="/settings/github" element={<GitHubSettingsFullPage />} />
          <Route path="/settings/telegram" element={<TelegramSettingsPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/teams/:teamId" element={<TeamDetailsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
          <Route path="/projects/:projectId/agent" element={<AgentPage />} />
          <Route path="/projects/:projectId/stages/:stageId" element={<StageDetailsPage />} />
        </Route>

        <Route path="/p/:shareToken" element={<PublicClientPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
