import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { readCachedProjectGraph } from '@nx/devkit';
import TOML from 'smol-toml';

const projectGraph = readCachedProjectGraph();

if (process.argv[2] === 'compiler') {

    const compilerNode = projectGraph.nodes['compiler'];
    const compilerPackageJson = fs.readFileSync(path.resolve(compilerNode.data.root, 'package.json'), 'utf-8');
    const compilerVersion = JSON.parse(compilerPackageJson).version;

    const sdkNode = projectGraph.nodes['sdk'];
    const sdkPath = path.resolve(sdkNode.data.root, 'package.json');

    let sdkPackageJson = fs.readFileSync(sdkPath, 'utf-8');
    sdkPackageJson = sdkPackageJson.replaceAll(/"@klave\/compiler": ".*"/g, `"@klave/compiler": "${compilerVersion}"`);
    fs.writeFileSync(sdkPath, sdkPackageJson, { flag: 'w', encoding: 'utf-8' });

    execSync(`git add "${path.normalize(sdkPath)}"`);
    execSync('git commit --amend --no-edit');
    execSync(`git tag -a -m "chore(compiler): Release version ${compilerVersion}" -f compiler@${compilerVersion}`);

} else if (process.argv[2] === 'crate') {

    const crateNode = projectGraph.nodes['crate'];
    const cratePackageJson = fs.readFileSync(path.resolve(crateNode.data.root, 'package.json'), 'utf-8');
    const crateVersion = JSON.parse(cratePackageJson).version;

    const crateTomlPath = path.resolve(crateNode.data.root, 'Cargo.toml')
    const crateToml = fs.readFileSync(crateTomlPath, 'utf-8');
    const crateConfig = TOML.parse(crateToml);

    crateConfig.package.version = crateVersion;
    fs.writeFileSync(crateTomlPath, TOML.stringify(crateConfig), { flag: 'w', encoding: 'utf-8' });

    execSync(`git add "${path.normalize(crateTomlPath)}"`);
    execSync('git commit --amend --no-edit');
    execSync(`git tag -a -m "chore(crate): Release version ${crateVersion}" -f crate@${crateVersion}`);
}