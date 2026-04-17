import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

const container = document.getElementById('root') as HTMLElement;
const tree = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Если HTML был пре-рендерен (внутри #root есть контент) — гидрируем.
// Иначе — обычный рендер. Это позволяет pre-render отдавать готовый HTML ботам,
// а React бесшовно оживляет его на клиенте.
if (container.hasChildNodes()) {
  ReactDOM.hydrateRoot(container, tree);
} else {
  ReactDOM.createRoot(container).render(tree);
}
