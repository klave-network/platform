import * as p from '@clack/prompts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import { replaceInFile } from 'replace-in-file';
import latestVersion from 'latest-version';
import { SubstitutionData } from '../lib/types';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';

/**
 * Create template files.
 */
export async function createTemplateAsync(targetDir: string, data: SubstitutionData) {

    const s = p.spinner();
    s.start('Creating template files');

    const sourceDir = isDev
        ? path.join(dirname, '../..', 'template', '.')
        : path.join(dirname, '../', 'template', '.');
    await fs.copy(sourceDir, targetDir, {
        filter: () => true,
        overwrite: false,
        errorOnExist: true
    });

    const gitignoreFile = path.join(targetDir, 'gitignore');
    if (fs.existsSync(gitignoreFile)) {
        fs.renameSync(gitignoreFile, path.join(targetDir, '.gitignore'));
    }

    await replaceInFile({
        files: path.join(targetDir, 'klave.json'),
        from: [/{{KLAVE_APP_SLUG}}/g, /{{KLAVE_APP_DESCRIPTION}}/g, /{{KLAVE_APP_VERSION}}/g],
        to: [data.project.slug, data.project.description, data.project.version],
        disableGlobs: true
    });

    await replaceInFile({
        files: path.join(targetDir, 'package.json'),
        from: [/{{KLAVE_APP_SLUG}}/g, /{{KLAVE_APP_DESCRIPTION}}/g, /{{KLAVE_APP_VERSION}}/g, /{{KLAVE_APP_AUTHOR}}/g, /{{KLAVE_APP_LICENSE}}/g, /{{KLAVE_APP_REPO}}/g],
        to: [data.project.slug, data.project.description, data.project.version, data.author, data.license, data.repo],
        disableGlobs: true
    });

    const latestSDK = await latestVersion('@klave/sdk');

    await replaceInFile({
        files: path.join(targetDir, 'package.json'),
        from: [/{{KLAVE_SDK_CURRENT_VERSION}}/g],
        to: [latestSDK ?? '*'],
        disableGlobs: true
    });

    await fs.rename(path.join(targetDir, 'apps', 'hello_world'), path.join(targetDir, 'apps', data.project.slug));
    s.stop('Template files created successfully');
}
