import { Route, Routes } from 'react-router-dom';
import { GuestOnly, RequireAuth } from './guards';
import { LandingPage } from '../pages/LandingPage';
import { SignInPage } from '../pages/SignInPage';
import { SignUpPage } from '../pages/SignUpPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { VerifyResetCodePage } from '../pages/VerifyResetCodePage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { ProjectDetailsPage } from '../pages/ProjectDetailsPage';
import { StageDetailsPage } from '../pages/StageDetailsPage';
import { PublicClientPage } from '../pages/PublicClientPage';
import { AuthCallbackPage } from '../pages/AuthCallbackPage';
import { TeamsPage } from '../pages/TeamsPage';
import { TeamDetailsPage } from '../pages/TeamDetailsPage';
import { TeamInvitePage } from '../pages/TeamInvitePage';
import { AdminPage } from '../pages/AdminPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ProfileSettingsPage } from '../pages/ProfileSettingsPage';
import { GitHubSettingsFullPage } from '../pages/GitHubSettingsFullPage';
import { TelegramSettingsPage } from '../pages/TelegramSettingsPage';
import { GitHubCallbackInstallPage } from '../pages/GitHubCallbackInstallPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

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
        <Route path="/projects/:projectId/stages/:stageId" element={<StageDetailsPage />} />
      </Route>

      <Route path="/p/:shareToken" element={<PublicClientPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
