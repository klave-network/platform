import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { readCachedProjectGraph } from '@nx/devkit';

const projectGraph = readCachedProjectGraph();

if (process.argv[2] === 'compiler') {

    const compilerNode = projectGraph.nodes['compiler'];
    const compilerPackageJson = fs.readFileSync(path.resolve(compilerNode.data.root, 'package.json'), 'utf-8');
    const compilerVersion = JSON.parse(compilerPackageJson).version;

    const sdkNode = projectGraph.nodes['sdk'];
    const sdkPath = path.resolve(sdkNode.data.root, 'package.json');

    let sdkPackageJson = fs.readFileSync(sdkPath, 'utf-8');
    sdkPackageJson = sdkPackageJson.replaceAll(/"@klave\/compiler": ".*"/g, `"@klave/compiler": "${compilerVersion}"`);
    fs.writeFileSync(sdkPath, sdkPackageJson);

    execSync(`git add "${path.normalize(sdkPath)}"`);
    execSync('git commit --amend --no-edit');
    execSync(`git tag -a -m "chore(compiler): Release version ${compilerVersion}" -f compiler@${compilerVersion}`);

} else if (process.argv[2] === 'sdk') {

    const sdkNode = projectGraph.nodes['sdk'];
    const sdkPackageJson = fs.readFileSync(path.resolve(sdkNode.data.root, 'package.json'), 'utf-8');
    const sdkVersion = JSON.parse(sdkPackageJson).version;

    const cliNode = projectGraph.nodes['cli'];
    const cliPath = path.resolve(cliNode.data.root, 'package.json');

    const createNode = projectGraph.nodes['create'];
    const createPath = path.resolve(createNode.data.root, 'package.json');

    let cliPackageJson = fs.readFileSync(cliPath, 'utf-8');
    cliPackageJson = cliPackageJson.replaceAll(/"@klave\/sdk": ".*"/g, `"@klave/sdk": "${sdkVersion}"`);
    fs.writeFileSync(cliPath, cliPackageJson);
    let createPackageJson = fs.readFileSync(createPath, 'utf-8');
    createPackageJson = createPackageJson.replaceAll(/"@klave\/sdk": ".*"/g, `"@klave/sdk": "${sdkVersion}"`);
    fs.writeFileSync(createPath, createPackageJson);

    execSync(`git add "${path.normalize(cliPath)}"`);
    execSync(`git add "${path.normalize(createPath)}"`);
    execSync('git commit --amend --no-edit');
    execSync(`git tag -a -m "chore(sdk): Release version ${sdkVersion}" -f compiler@${sdkVersion}`);

}