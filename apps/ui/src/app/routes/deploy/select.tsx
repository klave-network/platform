import { FC, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UilGithub, UilSpinner } from '@iconscout/react-unicons';
import api from '../../utils/api';
import { getFinalParseConfig } from '@klave/constants';
import qs from 'query-string';
import { Button } from '@klave/ui-kit/components/ui/button';

export const Select: FC = () => {

    const navigate = useNavigate();
    const { postInstall } = qs.parse(window.location.search);
    const [isPostInstall, setIsPostInstall] = useState<boolean>(postInstall === 'true');
    const [shouldRefresh, setShouldRefresh] = useState(false);
    const { invalidate } = api.useUtils().v0.auth.getSession;
    const { data: deployables, isLoading, isFetching, isRefetching, isError, refetch, error } = api.v0.repos.deployables.useQuery({
        refreshing: shouldRefresh
    }, {
        gcTime: 0,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false
    });

    useEffect(() => {

        if (error?.message === 'Credentials refresh required')
            invalidate().then(() => navigate('/deploy')).catch(() => { return; });

    }, [error, invalidate, navigate]);

    useEffect(() => {
        if (isPostInstall) {
            setIsPostInstall(false);
            setShouldRefresh(true);
            navigate('/deploy/select');
        }
    }, [navigate, postInstall]);

    const rescanRepos = () => {
        if (shouldRefresh)
            refetch().catch(() => { return; });
        else
            setShouldRefresh(true);
    };

    const isWorking = isLoading || isFetching || isRefetching;

    if (isWorking)
        return (
            <div className="flex flex-col gap-6 text-center">
                <h1 className="text-xl font-bold">Looking for your best work</h1>
                <p>
                    We are looking for repositories you can deploy on the Klave network.<br />
                    It will only take a moment...
                </p>
                <UilSpinner className='inline-block animate-spin h-5' />
            </div>
        );

    if (isError) {
        return (
            <div className="flex flex-col gap-6 text-center">
                <h1 className="text-xl font-bold">Oops! Something went wrong...</h1>
                <p>
                    Error message: {error.message}
                </p>
                <Button
                    variant="secondary"
                    disabled={isWorking}
                    onClick={rescanRepos}
                >
                    Rescan
                </Button>
            </div>
        );
    }

    const state = JSON.stringify({
        referer: window.location.origin,
        source: 'github',
        redirectUri: '/deploy/select?postInstall=true'
    });

    const githubAppInstall = new URL('https://github.com/apps/klave-network/installations/new');
    githubAppInstall.searchParams.append('state', state);

    return (
        <div className="flex flex-col gap-6 text-center">
            <h1 className="text-xl font-bold">{deployables?.length ? 'We found some gems' : 'Nothing to see'}</h1>
            {deployables?.length ? <>
                <p>
                    Here are the repositories we found could be deployed.<br />
                    Select one to continue...<br />
                </p>
                <div className="grid gap-3 grid-cols-3">
                    {deployables.map((repo) => {
                        const fullName = `${repo.owner}/${repo.name}`;
                        const isReachableByApp = repo.installationRemoteId !== '';
                        const configParseResult = getFinalParseConfig(repo.config);
                        const config = configParseResult.success ? configParseResult.data : undefined;
                        const insides = <div className={`w-full border-border border rounded-lg py-3 px-4 text-left ${isReachableByApp ? ((config?.applications?.length ?? 0) === 0 ? 'opacity-30' : 'hover:border-primary hover:cursor-pointer') : 'opacity-50 bg-yellow-100 hover:bg-yellow-200 text-yellow-700'}`}>
                            <span className='flex flex-row gap-2 items-center'><UilGithub className='inline-block h-5 w-5' /><span>{repo.owner}/<b>{repo.name}</b></span></span>
                            {isReachableByApp
                                ? <i className='text-sm'>We found {config?.applications?.length ?? 0} application{(config?.applications?.length ?? 0) > 1 ? 's' : ''}</i>
                                : <>
                                    <i className='text-sm'>You must install Klave on this reposiroty first</i>
                                </>}
                        </div>;
                        return (config?.applications?.length ?? 0) === 0
                            ? <div key={fullName}>{insides}</div>
                            : <Link to={`/deploy/repo/${fullName}`} key={fullName}>
                                {insides}
                            </Link>;
                    })}
                </div>
                <div className="flex flex-col gap-2">
                    <p>
                        Is your repository private?<br />
                        You will need to allow Klave to see it first by installing it on your repo.
                    </p>
                    <Button className="w-auto self-center" asChild>
                        <a
                            href={githubAppInstall.toString()}
                        >
                            Install Klave now
                        </a>
                    </Button>
                </div>
                <div className="flex flex-col gap-2">
                    <p>
                        Not finding what you are looking for?<br />
                        Make sure your repository contains a <code>klave.json</code> file.<br />
                        Try rescanning your repositories after.
                    </p>
                    <Button
                        variant="secondary"
                        disabled={isWorking}
                        onClick={rescanRepos}
                        className="w-auto self-center"
                    >
                        Rescan
                    </Button>
                </div>
            </> : <div className="flex flex-col gap-2">
                <p>
                    We looked hard but could not find anyting to deploy.<br />
                    Perhaps try to rescan your repositories<br />
                </p>
                <Button
                    variant="secondary"
                    disabled={isWorking}
                    onClick={rescanRepos}
                    className="w-auto self-center"
                >
                    Rescan
                </Button>
            </div>}
        </div>
    );
};

export default Select;
