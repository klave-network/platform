import { exec } from 'child_process';

/**
 * Opens a URL in the browser
 */
export function openURL(url: string) {
    const command = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    exec(`${command} ${url}`, (error) => {
        if (error) {
            console.error('Error opening URL:', error);
        } else {
            console.log('URL opened in the default browser');
        }
    });
}
