import { defineConfig as defineViteConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import git from 'git-rev-sync';
import { version } from './package.json';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { permissiblePeers } from '../../libs/constants/src/constants';

export default defineViteConfig({
    cacheDir: '../../node_modules/.vite/ui',

    build: {
        outDir: '../../dist/apps/ui',
        emptyOutDir: true
    },

    server: {
        host: 'localhost',
        cors: {
            origin: permissiblePeers,
            // allowedHeaders: ['Sentry-Trace', 'Baggage'],
            credentials: true
        },
        fs: {
            // Allow serving files from one level up to the project root
            allow: ['..']
        }
    },

    preview: {
        host: 'localhost'
    },

    plugins: [react(), nxViteTsPaths()],

    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ nxViteTsPaths() ],
    // },

    define: {
        'import.meta.vitest': undefined,
        'import.meta.env.VITE_REPO_COMMIT': JSON.stringify(git.long()),
        'import.meta.env.VITE_REPO_BRANCH': JSON.stringify(git.branch()),
        'import.meta.env.VITE_REPO_DIRTY': git.isDirty(),
        'import.meta.env.VITE_REPO_VERSION': JSON.stringify(version)
    },

    test: {
        reporters: ['default'],
        globals: true,
        passWithNoTests: true,
        environment: 'jsdom',
        watch: false,
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        includeSource: ['src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
    }
});
