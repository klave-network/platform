import { KLAVE_CYAN_BG } from '../lib/constants';
import chalk from 'chalk';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import * as p from '@clack/prompts';
import validateNpmPackage from 'validate-npm-package-name';
import sanitize from 'sanitize-filename';

type NewType = {
    template?: 'typescript' | 'rust';
    name?: string;
};

// `yarn run` may change the current working dir, then we should use `INIT_CWD` env.
const CWD = process.env.INIT_CWD || process.cwd();
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export const add = async ({ template, name }: NewType) => {

    // Checks if file klave.json exists
    const klaveConfigPath = path.join(CWD, 'klave.json');

    // Check if the JSON file exists
    if (!fs.existsSync(klaveConfigPath)) {
        console.error(chalk.red('Error: klave.json file not found. Make sure you are in a Klave project.'));
        process.exit(1);
    }

    // Read the current JSON file content
    const data = JSON.parse(fs.readFileSync(klaveConfigPath, 'utf-8'));

    // Validate the structure of the JSON file
    if (!data.applications || !Array.isArray(data.applications)) {
        console.error(chalk.red('Error: Invalid klave.json file structure.'));
        process.exit(1);
    }

    console.log('\n');
    p.intro(KLAVE_CYAN_BG(chalk.bold.black(' Klave - The honest-by-design platform ')));
    p.note('Let\'s add a new honest app to your project!');

    const appInfo = await p.group(
        {
            // Ask for the name of the app
            ...(!name && {
                appName: async () => p.text({
                    message: 'What is the name of your honest application?',
                    initialValue: 'hello-world',
                    validate(value) {
                        if (value.length === 0)
                            return 'Project name is required';
                        if (!validateNpmPackage(sanitize(value)).validForNewPackages)
                            return 'The name can only contain ASCII letters, digits, and the characters ., -, and _';
                        return;
                    }
                })
            }),
            // Ask for the language of the app
            ...(!template && {
                template: async () => p.select({
                    message: 'What language would you like to use?',
                    options: [
                        { value: 'ts', label: 'TypeScript' },
                        { value: 'rs', label: 'Rust' }
                    ]
                })
            }),
            // Ask for the description of the project
            description: async () => p.text({
                message: 'How would you describe your honest application?',
                initialValue: 'This is an honest application for the Klave Network',
                validate(value) {
                    if (value.length === 0)
                        return 'Project description is required.';
                    return;
                }
            })
        },
        {
            // On Cancel callback that wraps the group
            // So if the user cancels one of the prompts in the group this function will be called
            onCancel: () => {
                p.cancel('Operation cancelled.');
                process.exit(0);
            }
        }
    );

    const appName = (name ?? appInfo.appName) as string;
    const appTemplate = template ?? appInfo.template as 'typescript' | 'rust';

    // Define paths
    const appsDir = path.join(CWD, 'apps');

    // Template source paths vary based on selected template
    let templateDir: string;
    let newAppDir: string;
    // const templateDir = path.join(dirname, '../..', 'template', './apps/hello_world');
    // const newAppDir = path.join(appsDir, appName);

    if (appTemplate === 'rust') {
        // For rust template, we need to:
        // 1. Copy the rust-template app
        // 2. Update the app name in the Cargo.toml and other files
        templateDir = path.join(dirname, '../..', 'template', 'rust', 'apps', 'rust-template');
        newAppDir = path.join(appsDir, appName);

        // If working with Rust, we also need to update the workspace Cargo.toml
        const workspaceCargoPath = path.join(CWD, 'Cargo.toml');

        // Create workspace Cargo.toml if it doesn't exist
        if (!fs.existsSync(workspaceCargoPath)) {
            const workspaceCargoContent = `[workspace]
members = ["apps/${appName}"]
resolver = "2"

[profile.release]
lto = true
# Tell \`rustc\` to optimize for small code size.
opt-level = "z"
strip = true
codegen-units = 1
`;
            fs.writeFileSync(workspaceCargoPath, workspaceCargoContent);
        } else {
            // Update existing workspace Cargo.toml to include the new app
            let cargoContent = fs.readFileSync(workspaceCargoPath, 'utf-8');
            
            // Parse the members array from the Cargo.toml
            const membersMatch = cargoContent.match(/members\s*=\s*\[(.*?)\]/s);
            if (membersMatch && membersMatch[1]) {
                const currentMembers = membersMatch[1].split(',').map(m => m.trim().replace(/"/g, ''));
                const newMemberPath = `"apps/${appName}"`;
                
                // Add the new app if it's not already there
                if (!currentMembers.includes(newMemberPath)) {
                    const updatedMembers = [...currentMembers, newMemberPath].filter(Boolean);
                    const updatedMembersStr = updatedMembers.join(', ');
                    cargoContent = cargoContent.replace(membersMatch[0], `members = [${updatedMembersStr}]`);
                    fs.writeFileSync(workspaceCargoPath, cargoContent);
                }
            }
        }
    } else {
        // Default to typescript template
        templateDir = path.join(dirname, '../..', 'template', 'typescript', 'apps', 'hello_world');
        newAppDir = path.join(appsDir, appName);
    }
    
    // Check if apps directory exists
    if (!fs.existsSync(appsDir)) {
        fs.mkdirSync(appsDir, { recursive: true });
    }

    // Check if app already exists
    if (fs.existsSync(newAppDir)) {
        throw new Error(`App '${appName}' already exists.`);
    }
    
    // Copy template to new app directory
    await fs.copy(templateDir, newAppDir);
    
    // For Rust apps, update the package name in Cargo.toml
    if (appTemplate === 'rust') {
        const cargoPath = path.join(newAppDir, 'Cargo.toml');
        if (fs.existsSync(cargoPath)) {
            let cargoContent = fs.readFileSync(cargoPath, 'utf-8');
            cargoContent = cargoContent.replace(/name = "rust-template"/, `name = "${appName}"`);
            
            // Also update the package metadata component line
            cargoContent = cargoContent.replace(
                /package = "component:rust-template"/,
                `package = "component:${appName}"`
            );
            
            fs.writeFileSync(cargoPath, cargoContent);
        }
        
        // Update the source files that need to reference the component
        const bindingsPath = path.join(newAppDir, 'src', 'bindings.rs');
        if (fs.existsSync(bindingsPath)) {
            let bindingsContent = fs.readFileSync(bindingsPath, 'utf-8');
            
            // Replace references to rust-template with the new app name
            bindingsContent = bindingsContent.replace(/component:rust-template\/rust-template/g, `component:${appName}/${appName}`);
            bindingsContent = bindingsContent.replace(/\x0brust-template/g, `\x0b${appName}`);
            
            fs.writeFileSync(bindingsPath, bindingsContent);
        }
    }

    // Add the new application object to the applications array
    data.applications.push({
        slug: appName,
        description: appInfo.description,
        version: '0.0.1',
        rootDir: `/apps/${appName}`
    });

    // Write the updated JSON back to the file
    fs.writeFileSync(klaveConfigPath, JSON.stringify(data, null, 4), 'utf-8');
    console.log(chalk.green(`✨ Successfully created ${appTemplate} app '${appName}'`));

    // Additional guidance for Rust projects
    if (appTemplate === 'rust') {
        console.log(chalk.yellow(`
To build your Rust app, run:
    cargo component build --target wasm32-unknown-unknown --release
        
Make sure you have the required tools installed:
    - cargo-component: cargo install cargo-component
    - wasm32 target: rustup target add wasm32-unknown-unknown
    `));
    }
};
