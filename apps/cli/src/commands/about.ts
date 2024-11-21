import { Command } from 'commander';

export function about() {
    const aboutCmd = new Command('about');

    aboutCmd.action(() => {
        console.log('about');
    });

    return aboutCmd;
}
