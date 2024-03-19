import { FC, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UilGithub, UilSpinner } from '@iconscout/react-unicons';
import api from '../../utils/api';
import { getFinalParseConfig } from '@klave/constants';
import qs from 'query-string';

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
        return <>
            <div className='pb-5' >
                <h1 className='text-xl font-bold'>Looking for your best work</h1>
            </div>
            <div className='relative'>
                We are looking for repositories you can deploy on the Klave network.<br />
                It will only take a moment...
                <br />
                <br />
                <UilSpinner className='inline-block animate-spin' />
            </div>
        </>;

    if (isError) {
        return <>
            <div className='pb-5' >
                <h1 className='text-xl font-bold'>Oops! Something went wrong...</h1>
            </div>
            <div className='relative'>
                Error message: {error.message}
                <br />
                <br />
                <button disabled={isWorking} onClick={rescanRepos} className='btn btn-sm disabled:text-gray-300'>Rescan</button>
            </div>
        </>;
    }

    const state = JSON.stringify({
        referer: window.location.origin,
        source: 'github',
        redirectUri: '/deploy/select?postInstall=true'
    });

    const githubAppInstall = new URL('https://github.com/apps/klave-network/installations/new');
    githubAppInstall.searchParams.append('state', state);

    return <>
        <div className='pb-5'>
            <h1 className='text-xl font-bold'>{deployables?.length ? 'We found some gems' : 'Nothing to see'}</h1>
        </div>
        <div className='relative'>
            {deployables?.length ? <>
                Here are the repositories we found could be deployed.<br />
                Select one to continue...<br />
                <br />
                <div className='grid gap-3 grid-cols-3'>
                    {deployables.map((repo) => {
                        const fullName = `${repo.owner}/${repo.name}`;
                        const isReachableByApp = repo.installationRemoteId !== '';
                        const configParseResult = getFinalParseConfig(repo.config);
                        const config = configParseResult.success ? configParseResult.data : undefined;
                        const insides = <div className={`w-full border-slate-200 border rounded-lg py-3 px-4 text-left ${isReachableByApp ? ((config?.applications?.length ?? 0) === 0 ? 'opacity-30' : 'hover:border-slate-400 hover:cursor-pointer') : 'opacity-50 bg-yellow-100 hover:bg-yellow-200 text-yellow-700'}`}>
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
                <br />
                <br />
                <br />
                Is your repository private ?<br />
                You will need to allow Klave to see it first by installing it on your repo.<br /> <br />
                <a href={githubAppInstall.toString()} className='btn btn-sm bg-blue-600 text-white hover:bg-blue-500 rounded-md disabled:text-gray-300'>Install Klave now</a>
                <br />
                <br />
                Not finding what you are looking for ?<br />
                Make sure your repository contains a <code>klave.json</code> file.<br />
                Try rescanning your repositories after.
                <br />
                <br />
                <button disabled={isWorking} onClick={rescanRepos} className='btn btn-sm bg-blue-600 text-white hover:bg-blue-500 rounded-md disabled:text-gray-300'>Rescan</button>
            </> : <>
                We looked hard but could not find anyting to deploy.<br />
                Perhaps try to rescan your repositories<br />
                <br />
                <button disabled={isWorking} onClick={rescanRepos} className='btn btn-sm bg-blue-600 text-white hover:bg-blue-500 rounded-md disabled:text-gray-300'>Rescan</button>
            </>}
        </div>
    </>;
};

export default Select;