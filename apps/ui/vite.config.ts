import { defineConfig as defineViteConfig, PluginOption } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import mkcert from 'vite-plugin-mkcert';
import tailwindcss from '@tailwindcss/vite';
import { version } from './package.json';
import { current } from '../../tools/scripts/gitInfo.mjs';

const gitInfo = current();

export default defineViteConfig({
    cacheDir: '../../node_modules/.vite/ui',

    build: {
        outDir: '../../dist/apps/ui',
        emptyOutDir: true
    },

    server: {
        host: 'klave.ui.127.0.0.1.nip.io',
        https: {},
        fs: {
            // Allow serving files from one level up to the project root
            allow: ['..']
        }
    },

    preview: {
        host: 'klave.ui.127.0.0.1.nip.io'
    },

    plugins: [
        mkcert({
            keyFileName: 'klave-ui-dev-key.pem',
            certFileName: 'klave-ui-dev-cert.pem'
        }),
        tailwindcss(),
        react(),
        nxViteTsPaths()
    ] as PluginOption[],

    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ nxViteTsPaths() ],
    // },

    define: {
        'import.meta.vitest': undefined,
        'import.meta.env.VITE_REPO_COMMIT': JSON.stringify(gitInfo.long),
        'import.meta.env.VITE_REPO_BRANCH': JSON.stringify(gitInfo.branch),
        'import.meta.env.VITE_REPO_DIRTY': gitInfo.isDirty,
        'import.meta.env.VITE_REPO_VERSION': JSON.stringify(version)
    },

    test: {
        reporters: ['default'],
        globals: true,
        passWithNoTests: true,
        environment: 'jsdom',
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        includeSource: ['src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
    }
});
