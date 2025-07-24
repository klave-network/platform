import { UilExclamationTriangle, UilGithub, UilRocket, UilSpinner } from '@iconscout/react-unicons';
import { ChevronUpIcon, ChevronDownIcon, CheckIcon } from '@radix-ui/react-icons';
import * as Select from '@radix-ui/react-select';
import { ChangeEventHandler, ComponentProps, FC, useState } from 'react';
import api, { Router } from '../../utils/api';
import type { inferRouterInputs } from '@trpc/server';
import GitRepoListing from './GitRepoListing';

type GitRepoBrowserProps = {
    provider: inferRouterInputs<Router>['v0']['integrations']['getInstallations']['provider'];
    onTokenInvalid: () => void;
    onRepoSelect?: ComponentProps<typeof GitRepoListing>['onRepoSelect'];
}

const GitRepoBrowser: FC<GitRepoBrowserProps> = ({ onRepoSelect, onTokenInvalid, provider }) => {
    const [searchTerm, setSearchTerm] = useState<string | undefined>();
    const [selectedInstallationId, setSelectedInstallationId] = useState<string | null>(null);
    const { data: installationsData, isFetching, isLoading } = api.v0.integrations.getInstallations.useQuery({
        provider
    }, {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false
    });

    if (isFetching || isLoading) {
        return <div className="flex flex-col">
            <div className="flex gap-4">
                <span className="input input-bordered w-full mb-5"><UilSpinner className="animate-spin h-6 w-6 text-gray-500" /> Loading...</span>
                <input disabled={true} placeholder="Search..." className="input input-bordered" />
            </div>
            <div className="flex flex-col justify-center items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-900 h-80 overflow-y-auto">
                <span className="text-gray-600 dark:text-gray-300">Your work is loading</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm w-2/3">We are searching for your repositories...</span>
            </div>
        </div>;
    }

    if (!installationsData) {
        return <div className="flex flex-col">
            <div className="flex gap-4">
                <input disabled={true} placeholder="Organisations" className="input input-bordered mb-5" />
                <input disabled={true} placeholder="Search..." className="input input-bordered" />
            </div>
            <div className="flex flex-col justify-center items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-900 h-80 overflow-y-auto">
                <span className="text-gray-600 dark:text-gray-300"><UilExclamationTriangle className="h-6 w-6" /></span>
                <span className="text-gray-600 dark:text-gray-300">There's a problem</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm w-2/3">We failed to load installations. Please try again later.</span>
            </div>
        </div>;
    }

    if (!installationsData.data?.length) {
        if (provider === 'github') {

            const state = JSON.stringify({
                referer: window.location.origin,
                source: provider,
                redirectUri: `/deploy/${provider}/select?postInstall=true`
            });

            const githubAppInstall = new URL('https://github.com/apps/klave-network/installations/new');
            githubAppInstall.searchParams.append('state', state);

            return <div className="flex flex-col">
                <div className="flex gap-4">
                    <input disabled={true} placeholder="Organisations" className="input input-bordered mb-5" />
                    <input disabled={true} placeholder="Search..." className="input input-bordered" />
                </div>
                <div className="flex flex-col justify-center items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-900 h-80 overflow-y-auto">
                    <span className="text-gray-600 dark:text-gray-300"><UilRocket className="h-6 w-6" /></span>
                    <span className="text-gray-600 dark:text-gray-300">Nothing yet</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm w-2/3">Make sure you have installed the Klave GitHub App and created a repository.</span>
                    <a href={githubAppInstall.toString()} className='btn btn-md h-8 mt-2 bg-gray-600 text-white hover:bg-gray-500 rounded-md disabled:text-gray-300'>Install Klave now</a>
                </div>
            </div>;
        }
        return <div className="flex flex-col">
            <div className="flex gap-4">
                <input disabled={true} placeholder="Organisations" className="input input-bordered mb-5" />
                <input disabled={true} placeholder="Search..." className="input input-bordered" />
            </div>
            <div className="flex flex-col justify-center items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-900 h-80 overflow-y-auto">
                <span className="text-gray-600 dark:text-gray-300"><UilExclamationTriangle className="h-6 w-6" /></span>
                <span className="text-gray-600 dark:text-gray-300">No provider available</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm w-2/3">Something went wrong. Please try again later.</span>
            </div>
        </div>;
    }

    if (selectedInstallationId === null) {
        setSelectedInstallationId(`${installationsData.data?.[0]?.id ?? null}`);
        return <div className="flex flex-col">
            <div className="flex gap-4">
                <span className="input input-bordered w-full mb-5"><UilSpinner className="animate-spin h-6 w-6 text-gray-500" /> Loading...</span>
                <input disabled={true} placeholder="Search..." className="input input-bordered" />
            </div>
            <div className="flex flex-col justify-center items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-900 h-80 overflow-y-auto">
                <span className="text-gray-600 dark:text-gray-300">Your work is loading</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm w-2/3">We are searching for your repositories...</span>
            </div>
        </div>;
    }

    if (installationsData.success === false && !installationsData.hasGithubToken) {
        onTokenInvalid();
        return <div className="flex flex-col">
            <div className="flex gap-4">
                <input disabled={true} placeholder="Organisations" className="input input-bordered mb-5" />
                <input disabled={true} placeholder="Search..." className="input input-bordered" />
            </div>
            <div className="flex flex-col justify-center items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-900 h-80 overflow-y-auto">
                <span className="text-gray-600 dark:text-gray-300"><UilExclamationTriangle className="h-6 w-6" /></span>
                <span className="text-gray-600 dark:text-gray-300">Your token has expired</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm w-2/3">We are redirecting you to renew your token</span>
            </div>
        </div>;
    }

    const handleSearchTerm: ChangeEventHandler<HTMLInputElement> = (e) => {
        const value = e.target.value.trim();
        if (value.length === 0)
            setSearchTerm(undefined);
        else
            setSearchTerm(value);
    };

    const data = installationsData.data ?? [];

    return <div className="flex flex-col">
        <div className="flex gap-4">
            <Select.Root defaultValue={`${data[0]?.id}`} onValueChange={setSelectedInstallationId}>
                <Select.Trigger className={'select select-bordered cursor-pointer select-md inline-flex justify-between flex-grow w-full items-center mb-5'}>
                    <Select.Value placeholder="Select an organisation" />
                </Select.Trigger>
                <Select.Portal>
                    <Select.Content className="overflow-hidden bg-white shadow-outline shadow-sm rounded-lg w-full z-[1000]">
                        <Select.ScrollUpButton>
                            <ChevronUpIcon />
                        </Select.ScrollUpButton>
                        <Select.Viewport>
                            <Select.Group>
                                {data.map((installation) =>
                                    <Select.Item
                                        key={installation.id}
                                        value={`${installation.id}`}
                                        className="flex h-9 items-center select-none cursor-pointer relative px-5 data-[selected]:font-bold data-[disabled]:text-slate-300 data-[disabled]:pointer-events-none data-[highlighted]:text-klave-light-blue data-[highlighted]:bg-gray-100 data-[highlighted]:outline-hidden"
                                    >
                                        <Select.ItemText>
                                            <UilGithub className="inline-block mr-2 h-5" />
                                            <span>{installation.name}</span>
                                        </Select.ItemText>
                                        <Select.ItemIndicator className="">
                                            <CheckIcon />
                                        </Select.ItemIndicator>

                                    </Select.Item>
                                )}
                            </Select.Group>
                        </Select.Viewport>
                        <Select.ScrollDownButton>
                            <ChevronDownIcon />
                        </Select.ScrollDownButton>
                    </Select.Content>
                </Select.Portal>
            </Select.Root>
            <input type="text" placeholder="Search..." className="input input-bordered w-full" onChange={handleSearchTerm} />
        </div>
        <GitRepoListing
            provider={provider}
            searchTerm={searchTerm}
            installationId={selectedInstallationId}
            onTokenInvalid={onTokenInvalid}
            onRepoSelect={onRepoSelect}
        />
    </div>;
};

export default GitRepoBrowser;
