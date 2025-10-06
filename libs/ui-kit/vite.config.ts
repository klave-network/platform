import { defineConfig, PluginOption } from 'vite';
import react from '@vitejs/plugin-react-swc';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { version } from './package.json';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { current } from '../../tools/scripts/gitInfo.mjs';

const gitInfo = current();

export default defineConfig({
    root: __dirname,
    cacheDir: '../../node_modules/.vite/libs/ui-kit',
    plugins: [
        react(),
        nxViteTsPaths(),
        nxCopyAssetsPlugin(['*.md']),
        dts({
            entryRoot: 'src',
            tsconfigPath: path.join(__dirname, 'tsconfig.lib.json')
        })
    ] as PluginOption[],
    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ nxViteTsPaths() ],
    // },
    // Configuration for building your library.
    // See: https://vitejs.dev/guide/build.html#library-mode
    build: {
        outDir: '../../dist/libs/ui-kit',
        emptyOutDir: true,
        reportCompressedSize: true,
        commonjsOptions: {
            transformMixedEsModules: true
        },
        lib: {
            // Could also be a dictionary or array of multiple entry points.
            entry: 'src/index.ts',
            name: 'ui-kit',
            fileName: 'index',
            // Change this to the formats you want to support.
            // Don't forget to update your package.json as well.
            formats: ['es']
        },
        rollupOptions: {
            // External packages that should not be bundled into your library.
            external: ['react', 'react-dom', 'react/jsx-runtime']
        }
    },
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
        watch: false,
        exclude: ['*'],
        include: ['src[\\/]**[\\/]*.{test,spec}.?(c|m)[jt]s?(x)'],
        includeSource: ['src[\\/]**[\\/]*.?(c|m)[jt]s?(x)']
    }
});
