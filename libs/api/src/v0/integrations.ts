import { Octokit } from '@octokit/rest';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';
import { probotOps } from '@klave/providers';
import { getFinalParseConfig } from '@klave/constants';

export const integrationsRouter = createTRPCRouter({
    getInstallations: publicProcedure
        .input(z.object({
            provider: z.literal('github')
        }))
        .query(async ({ ctx: { session }, input: { provider } }) => {

            if (!session.user)
                throw new Error('You must be logged in to do this');

            if (provider === 'github') {
                try {
                    const probot = probotOps.getProbot();
                    if (!probot)
                        throw new Error('GitHub connection is not initialized');

                    if (!session.githubToken?.accessToken) {
                        return {
                            success: false,
                            hasGithubToken: false,
                            message: 'GitHub token is not available'
                        };
                    }

                    const userOctokit = new Octokit({ auth: session.githubToken?.accessToken });
                    const userData = await userOctokit.paginate(
                        userOctokit.apps.listInstallationsForAuthenticatedUser,
                        {
                            per_page: 100
                        }
                    );

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const data = userData.map((inst) => ({ name: (inst.account as any)?.login, avatar: inst.account?.avatar_url, id: inst.id }));

                    return {
                        success: true,
                        data
                    };
                } catch (error) {
                    console.error('Error fetching GitHub installations:', error);
                    return {
                        success: false,
                        hasGithubToken: !!session.githubToken,
                        message: 'Failed to fetch GitHub installations'
                    };
                }
            } else {
                throw new Error('Unsupported provider');
            }
        }),
    getReposForInstallation: publicProcedure
        .input(z.object({
            installationId: z.number().or(z.string()),
            provider: z.literal('github')
        }))
        .query(async ({ ctx: { session }, input: { installationId, provider } }) => {

            if (!session.user)
                throw new Error('You must be logged in to do this');

            if (provider === 'github') {

                const probot = probotOps.getProbot();
                if (!probot)
                    throw new Error('GitHub connection is not initialized');

                if (!session.githubToken?.accessToken) {
                    return {
                        success: false,
                        hasGithubToken: false,
                        message: 'GitHub token is not available'
                    };
                }

                if (installationId === 0 || installationId === null) {
                    return {
                        success: true,
                        data: []
                    };
                }

                const userOctokit = new Octokit({ auth: session.githubToken?.accessToken });
                const userData = await userOctokit.paginate(
                    userOctokit.apps.listInstallationReposForAuthenticatedUser,
                    {
                        installation_id: Number(installationId),
                        per_page: 100
                    }
                );

                const filteredData = userData.map((repo) => ({
                    id: repo.id,
                    name: repo.name,
                    ownerLogin: repo.owner.login,
                    isPrivate: repo.private,
                    defaultBranch: repo.default_branch,
                    createdAt: repo.created_at,
                    updatedAt: repo.updated_at,
                    avatarUrl: repo.owner?.avatar_url,
                    config: null as null | ReturnType<typeof getFinalParseConfig>['data']
                }));

                const configuredRepos = await Promise.all(filteredData.map(async repo => {
                    try {

                        const handle = await userOctokit.repos.getContent({
                            owner: repo.ownerLogin,
                            repo: repo.name,
                            ref: repo.defaultBranch || undefined,
                            path: 'klave.json',
                            mediaType: {
                                format: 'raw+json'
                            }
                        });

                        const result = getFinalParseConfig(handle.data.toString());
                        repo.config = result.success ? result.data : null;
                    } catch (__unusedError) {
                        // If klave.json is not found, we can still return the repo without config
                        return null;
                    }
                    return repo;
                }));

                const data = configuredRepos.filter(repo => repo !== null);

                return {
                    success: true,
                    data
                };
            } else {
                throw new Error('Unsupported provider');
            }
        }),
    getRepoConfiguration: publicProcedure
        .input(z.object({
            provider: z.literal('github'),
            owner: z.string(),
            name: z.string()
        }))
        .query(async ({ ctx: { session }, input: { provider, owner, name } }) => {

            if (!session.user)
                throw new Error('You must be logged in to do this');

            provider = provider.trim() as typeof provider;
            owner = owner.trim();
            name = name.trim();

            if (provider as string === '' || owner === '' || name === '')
                throw new Error('Missing parameters');

            if (provider === 'github') {

                // const probot = probotOps.getProbot();
                // if (!probot)
                //     throw new Error('GitHub connection is not initialized');

                if (!session.githubToken?.accessToken) {
                    return {
                        success: false,
                        hasGithubToken: false,
                        message: 'GitHub token is not available'
                    };
                }

                const userOctokit = new Octokit({ auth: session.githubToken?.accessToken });
                try {
                    const repo = await userOctokit.repos.get({
                        owner,
                        repo: name
                    });
                    const handle = await userOctokit.repos.getContent({
                        owner,
                        repo: name,
                        path: 'klave.json',
                        mediaType: {
                            format: 'raw+json'
                        }
                    });

                    const result = getFinalParseConfig(handle.data.toString());
                    return {
                        success: true,
                        repo: repo.data,
                        config: result.success ? result.data : null
                    };
                } catch (__unusedError) {
                    // If klave.json is not found, we can still return the repo without config
                    return {
                        success: false
                    };
                }
            } else {
                throw new Error('Unsupported provider');
            }
        })

});

export default integrationsRouter;