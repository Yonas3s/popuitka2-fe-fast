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

      <Route element={<RequireAuth />}>
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
        <Route path="/projects/:projectId/stages/:stageId" element={<StageDetailsPage />} />
      </Route>

      <Route path="/p/:shareToken" element={<PublicClientPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
