import { Commit } from '@klave/db';

export interface DeploymentBasePayload {
    class: string;
    type: string;
    repo: {
        url: string;
        owner: string;
        name: string;
    };
    pusher: {
        login: string;
        htmlUrl: string;
        avatarUrl: string;
    }
}

export interface DeploymentPushPayload extends DeploymentBasePayload {
    class: 'push';
    forceDeploy: boolean;
    commit: {
        url: string;
        ref: string;
        before?: string;
        after: string;
    }
    headCommit: Commit | null;
}

export interface DeploymentPullRequestPayload extends DeploymentBasePayload {
    class: 'pull_request';
    commit: {
        url: string;
        ref: string;
        before?: string;
        after: string;
    },
    headCommit: Commit | null;
    pullRequest: {
        url: string;
        number: number;
    }
}

export type DeploymentPayload = DeploymentPushPayload | DeploymentPullRequestPayload;