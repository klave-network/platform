import path from 'path';
import { Answers, PromptObject } from 'prompts';
import sanitize from 'sanitize-filename';
import validateNpmPackage from 'validate-npm-package-name';
import { findGitHubEmail, findGitHubProfileUrl, findMyName, guessRepoUrl } from '~/lib/utils';
import { text } from '@clack/prompts';

export async function getSlugPrompt(customTargetPath?: string | null): Promise<string> {
    const targetBasename = customTargetPath && path.basename(customTargetPath);
    const initial =
        targetBasename && validateNpmPackage(targetBasename).validForNewPackages
            ? targetBasename
            : 'my-honest-app';

    const slug = await text({
        message: 'What is the name of your honest application?',
        placeholder: 'my-project',
        initialValue: initial,
        validate(value) {
            if (value.length === 0)
                return 'Project name is required.';
            if (!validateNpmPackage(sanitize(value)).validForNewPackages)
                return 'The name can only contain ASCII letters, digits, and the characters ., -, and _';
            return;
        }
    }) as string;

    return slug;
}

export async function getSubstitutionDataPrompts(slug: string): Promise<PromptObject<string>[]> {
    return [
        {
            type: 'text',
            name: 'description',
            message: 'How would you describe your honest application?',
            initial: 'This is a honest application for the Klave Network',
            validate: (input) => !!input || 'The description cannot be empty'
        },
        {
            type: 'text',
            name: 'authorName',
            message: 'What is the name of the author?',
            initial: await findMyName(),
            validate: (input) => !!input || 'Cannot be empty'
        },
        {
            type: 'text',
            name: 'authorEmail',
            message: 'What is the email address of the author?',
            initial: await findGitHubEmail()
        },
        {
            type: 'text',
            name: 'authorUrl',
            message: 'What is the URL to the author\'s GitHub profile?',
            initial: async (_, answers: Answers<string>) =>
                await findGitHubProfileUrl(answers.authorEmail)
        },
        {
            type: 'text',
            name: 'repo',
            message: 'What is the URL for the repository?',
            initial: async (_, answers: Answers<string>) => await guessRepoUrl(answers.authorUrl, slug)
            // validate: (input) => /^https?:\/\//.test(input) || 'Must be a valid URL'
        }
    ];
}

export async function getAppDataPrompts(): Promise<PromptObject<string>[]> {
    return [
        {
            type: 'text',
            name: 'slug',
            message: 'What is the package name?',
            initial: 'my-honest-app',
            validate: (input) =>
                validateNpmPackage(sanitize(input)).validForNewPackages || 'Must be a valid npm package name'
        },
        {
            type: 'text',
            name: 'name',
            message: 'What is the name of your honest application?',
            initial: 'My honest application',
            validate: (input) => !!input || 'The name cannot be empty'
        }
    ];
}
