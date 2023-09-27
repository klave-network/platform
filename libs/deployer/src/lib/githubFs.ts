import type { Context } from 'probot';
import { RepoFs } from './repoFs';

type Octokit = Context['octokit'];

type GithubFsRepoInfo = {
    owner: string;
    name: string;
    commit: string;
}

type GithubFsOptions = {
    octokit?: Octokit;
    repoInfo: GithubFsRepoInfo;
};

export class GithubFs implements RepoFs {

    octokit?: Octokit;
    repoInfo?: GithubFsRepoInfo;
    basePath = '.';

    constructor(options: GithubFsOptions) {
        this.octokit = options.octokit;
        this.repoInfo = options.repoInfo;
    }

    withOctokit(octokit: Octokit) {
        this.octokit = octokit;
    }

    async getFileContent(path = '.'): Promise<string | null> {

        if (!this.repoInfo)
            throw new Error('Repo info not set');

        if (!this.octokit)
            throw new Error('Octokit not set');

        const content = await this.octokit.repos.getContent({
            owner: this.repoInfo.owner,
            repo: this.repoInfo.name,
            ref: this.repoInfo.commit,
            path,
            mediaType: {
                format: 'raw+json'
            }
        });
        if (typeof content.data === 'object' && Array.isArray(content.data)) {
            const indexFile = content.data.find(file => ['index.ts'].includes(file.name));
            if (!indexFile)
                return null;
            return await this.getFileContent(indexFile?.path);
        }
        return content.data?.toLocaleString();
    }

    async getFiles() {
        return [];
    }

    setBasePath(path: string) {
        this.basePath = path;
    }
}

export default GithubFs;