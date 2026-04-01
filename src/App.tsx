import { BrowserRouter } from 'react-router-dom';
import { Providers } from './app/providers';
import { AppRoutes } from './app/router';
import { DuckAssistant } from './components/duck/DuckAssistant';

export const App = () => {
  return (
    <Providers>
      <BrowserRouter>
        <AppRoutes />
        <DuckAssistant />
      </BrowserRouter>
    </Providers>
  );
};
