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
export async function createTemplateAsync(
    targetDir: string, 
    data: SubstitutionData, 
    templateType: 'typescript' | 'rust'
) {

    const s = p.spinner();
    s.start('Creating template files');
    
    // Select the right template based on type
    const templateSubdir = templateType === 'rust' ? 'rust' : 'typescript';

    const sourceDir = isDev
        ? path.join(dirname, '../..', 'template', templateSubdir)
        : path.join(dirname, '../', 'template', templateSubdir);
    
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

    // Only process package.json if it exists (TypeScript template)
    const packageJsonPath = path.join(targetDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        await replaceInFile({
            files: packageJsonPath,
            from: [/{{KLAVE_APP_SLUG}}/g, /{{KLAVE_APP_DESCRIPTION}}/g, /{{KLAVE_APP_VERSION}}/g, /{{KLAVE_APP_AUTHOR}}/g, /{{KLAVE_APP_LICENSE}}/g, /{{KLAVE_APP_REPO}}/g],
            to: [data.project.slug, data.project.description, data.project.version, data.author, data.license, data.repo],
            disableGlobs: true
        });

        const latestSDK = await latestVersion('@klave/sdk');

        await replaceInFile({
            files: packageJsonPath,
            from: [/{{KLAVE_SDK_CURRENT_VERSION}}/g],
            to: [latestSDK ?? '*'],
            disableGlobs: true
        });
    }

    // Handle Rust-specific processing
    if (templateType === 'rust') {
        // Update Cargo.toml in both workspace and app
        const cargoTomlPath = path.join(targetDir, 'Cargo.toml');
        const appCargoTomlPath = path.join(targetDir, 'apps', 'rust-template', 'Cargo.toml');
        
        if (fs.existsSync(cargoTomlPath)) {
            await replaceInFile({
                files: cargoTomlPath,
                from: [/members\s*=\s*\["apps\/rust-template"\]/],
                to: [`members = ["apps/${data.project.slug}"]`],
                disableGlobs: true
            });
        }
        
        if (fs.existsSync(appCargoTomlPath)) {
            await replaceInFile({
                files: appCargoTomlPath,
                from: [
                    /name = "rust-template"/,
                    /package = "component:rust-template"/
                ],
                to: [
                    `name = "${data.project.slug}"`,
                    `package = "component:${data.project.slug}"`
                ],
                disableGlobs: true
            });
        }
        
        // Update bindings.rs
        const bindingsPath = path.join(targetDir, 'apps', 'rust-template', 'src', 'bindings.rs');
        if (fs.existsSync(bindingsPath)) {
            let bindingsContent = fs.readFileSync(bindingsPath, 'utf-8');
            
            // Replace references to rust-template with the new app name
            bindingsContent = bindingsContent.replace(/component:rust-template\/rust-template/g, `component:${data.project.slug}/${data.project.slug}`);
            bindingsContent = bindingsContent.replace(/\x0brust-template/g, `\x0b${data.project.slug}`);
            
            fs.writeFileSync(bindingsPath, bindingsContent);
        }
            
        // Rename the app directory
        await fs.rename(path.join(targetDir, 'apps', 'rust-template'), path.join(targetDir, 'apps', data.project.slug));
    } else {
        // For TypeScript, just rename the app directory
        await fs.rename(path.join(targetDir, 'apps', 'hello_world'), path.join(targetDir, 'apps', data.project.slug));
    }
    
    s.stop('Template files created successfully');
}
