import { UilExclamationTriangle, UilPadlock, UilSpinner } from '@iconscout/react-unicons';
import { FC, MouseEventHandler } from 'react';
import * as dateFns from 'date-fns';
import Highlighter from 'react-highlight-words';
import api, { Router } from '../../utils/api';
import type { inferProcedureInput, inferProcedureOutput } from '@trpc/server';

type GitRepoBrowserProps = {
    provider: inferProcedureInput<Router['v0']['integrations']['getInstallations']>['provider'];
    searchTerm?: string;
    installationId: string | null;
    onTokenInvalid: () => void;
    onRepoSelect?: (repo: NonNullable<inferProcedureOutput<Router['v0']['integrations']['getReposForInstallation']>['data']>[number] & unknown) => void;
}

const GitRepoListing: FC<GitRepoBrowserProps> = ({ onRepoSelect, onTokenInvalid, provider, installationId, searchTerm }) => {

    const { data: repositoriesData, isFetching, isLoading } = api.v0.integrations.getReposForInstallation.useQuery({
        provider,
        installationId: Number(installationId)
    }, {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false
    });

    if (isFetching || isLoading) {
        return <div className="flex flex-col justify-center items-center  rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-900 h-80 overflow-y-auto">
            <span className="text-gray-600 dark:text-gray-300"><UilSpinner className="animate-spin h-6 w-6" /></span>
            <span className="text-gray-600 dark:text-gray-300">Loading your repositories...</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm w-2/3">It will only be a couple of seconds.</span>
        </div>;
    }

    if (!repositoriesData) {
        return <div className="flex flex-col justify-center items-center  rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-900 h-80 overflow-y-auto">
            <span className="text-gray-600 dark:text-gray-300"><UilExclamationTriangle className="h-6 w-6" /></span>
            <span className="text-gray-600 dark:text-gray-300">Failed to load repositories</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm w-2/3">Please try again later.</span>
        </div>;
    }

    if (repositoriesData.success === false && !repositoriesData.hasGithubToken) {
        onTokenInvalid();
        return <div className="flex flex-col justify-center items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-900 h-80 overflow-y-auto">
            <span className="text-gray-600 dark:text-gray-300">Your token has expired</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm w-2/3">We are redirecting you to renew your token</span>
        </div>;
    }

    const repos = (repositoriesData.data ?? [])
        .filter(repo => {
            if (!searchTerm) return true;
            const lowerSearchTerm = searchTerm.toLowerCase();
            return repo.name.toLowerCase().includes(lowerSearchTerm);
        })
        .map((repo) => ({
            ...repo,
            createdAtDate: repo.createdAt ? dateFns.parseISO(repo.createdAt) : null,
            updatedAtDate: repo.updatedAt ? dateFns.parseISO(repo.updatedAt) : null
        }))
        .sort((a, b) => {
            if (a.updatedAtDate && b.updatedAtDate) {
                return b.updatedAtDate.getTime() - a.updatedAtDate.getTime();
            }
            return 0;
        });

    const state = JSON.stringify({
        referer: window.location.origin,
        source: provider,
        redirectUri: `/deploy/${provider}/select?postInstall=true`
    });

    const githubAppConfigure = new URL('https://github.com/apps/klave-network/installations/new');
    githubAppConfigure.searchParams.append('state', state);

    if (repos.length === 0) {
        return <div className="flex flex-col items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-900 h-80 overflow-y-auto">
            <span className="text-gray-600 dark:text-gray-300">No repositories found.</span>
            {searchTerm
                ? <span className="text-gray-500 dark:text-gray-400 text-sm w-2/3">No repositories match your search term "{searchTerm}".</span>
                : <span className="text-gray-500 dark:text-gray-400 text-sm w-2/3">We could not find any repositories matching your search.</span>
            }
            <span className="text-gray-500 dark:text-gray-400 text-sm w-2/3">You may need to check that you have authorised Klave to access your GitHub repositories.</span>
            <a href={githubAppConfigure.toString()} className='btn btn-md h-8 mt-2 bg-gray-600 text-white hover:bg-gray-500 rounded-md disabled:text-gray-300'>Configure Klave on GitHub</a>
        </div>;
    }

    const handleRepoSelection: MouseEventHandler<HTMLElement> = (e) => {
        const repoId = e.currentTarget.dataset.repoId;
        if (repoId) {
            const selectedRepo = repos.find(repo => repo.id === Number(repoId));
            if (selectedRepo)
                onRepoSelect?.(selectedRepo);
        }
    };

    return <div className="flex flex-col rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-900 h-80 overflow-y-auto">
        {repos.map((repo) => {

            let createdAtString = '';
            if (repo.createdAtDate)
                createdAtString = dateFns.intlFormat(repo.createdAtDate, {
                    year: '2-digit',
                    month: '2-digit',
                    day: 'numeric'
                });


            let updatedAtString = '';
            if (repo.updatedAtDate) {
                if (dateFns.differenceInCalendarMonths(new Date(), repo.updatedAtDate) > 3)
                    updatedAtString = dateFns.intlFormat(repo.updatedAtDate, {
                        year: '2-digit',
                        month: '2-digit',
                        day: 'numeric'
                    });
                else
                    updatedAtString = dateFns.intlFormat(repo.updatedAtDate, {
                        month: 'short',
                        day: 'numeric'
                    });
            }

            return <div key={repo.id} className='w-full h-16 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-600'>
                <div className='flex gap-4 py-2 px-4 h-full w-full'>
                    <div className='flex items-center justify-center'>
                        <img src={repo.avatarUrl} alt={repo.name} className='h-8 w-8 rounded-full mr-2' />
                    </div>
                    <div className='flex grow flex-col text-left'>
                        <span className="font-semibold align-middle"><Highlighter searchWords={[searchTerm ?? '']} autoEscape={true} textToHighlight={repo.name} highlightClassName="bg-klave-light-blue" />{repo.isPrivate && <UilPadlock className="inline -mt-1 h-4 text-xs text-gray-400" />}</span>
                        <span title={`Created ${createdAtString}`} className="text-sm text-gray-500">Last updated {updatedAtString}</span>
                    </div>
                    <div className='flex items-center justify-center'>
                        <button
                            type="button"
                            className="btn btn-sm"
                            data-repo-id={repo.id}
                            onClick={handleRepoSelection}    >
                            Deploy
                        </button>
                    </div>
                </div>
            </div>;
        })}
        {provider === 'github'
            ? <div className="flex flex-col items-center justify-center py-8 bg-gradient-to-b from-gray-100 dark:from-gray-800 to-transparent text-gray-600 dark:text-gray-300 text-sm">
                <span className="text-gray-800 dark:text-gray-300">Not finding what you are looking for ?</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm w-2/3">You may need to check that you have authorised Klave to access your GitHub repositories.</span>
                <a href={githubAppConfigure.toString()} className='btn btn-md h-8 mt-2 bg-gray-600 text-white hover:bg-gray-500 rounded-md disabled:text-gray-300'>Configure Klave on GitHub</a>
            </div>
            : null
        }
    </div>;
};

export default GitRepoListing;
