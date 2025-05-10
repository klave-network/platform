import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] ?? 'https://klave.ui.127.0.0.1.nip.io:4220';
/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();
// Need to add CI environment is nx run-many (we are obviously not running multiple feedback tests in parallel)
process.env.CI = process.argv.includes('run-many') ? 'true' : (process.env.CI ?? 'false');
/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    ...nxE2EPreset(__filename, { testDir: './src' }),
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        baseURL,
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
        // bypassCSP: true,
        // launchOptions: {
        //     args: ['--disable-web-security']
        // },
        ignoreHTTPSErrors: true
    },
    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'yarn nx serve ui',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        cwd: workspaceRoot,
        ignoreHTTPSErrors: true,
        stdout: 'pipe',
        stderr: 'pipe'
    }, projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } }
    ]
});
