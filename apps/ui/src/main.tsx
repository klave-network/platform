// import './wdyr';
import './app/utils/sentry';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app/Router';

const root = createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <StrictMode>
        <App />
    </StrictMode>
);
