import { FC, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UilExclamationTriangle, UilSpinner } from '@iconscout/react-unicons';
import api from '../../utils/api';

export const Select: FC = () => {

    const navigate = useNavigate();
    const [shouldRefresh, setShouldRefresh] = useState(false);
    const { invalidate } = api.useContext().v0.auth.getSession;
    const { data: deployables, isLoading, isFetching, isRefetching, isError, refetch, error } = api.v0.repos.deployables.useQuery({
        refreshing: shouldRefresh
    }, {
        queryKey: ['v0.repos.deployables', { refreshing: shouldRefresh }],
        cacheTime: 0,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false
    });

    useEffect(() => {

        if (error?.message === 'Credentials refresh required')
            invalidate().then(() => navigate('/deploy'));

    }, [error, invalidate, navigate]);

    const rescanRepos = () => {
        if (shouldRefresh)
            refetch();
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
                <button disabled={isWorking} onClick={rescanRepos} className='disabled:text-gray-300'>Rescan</button>
            </div>
        </>;
    }

    return <>
        <div className='pb-5'>
            <h1 className='text-xl font-bold'>{deployables?.length ? 'We found some gems' : 'Nothing to see'}</h1>
        </div>
        <div className='relative'>
            {deployables?.length ? <>
                Here are the repositories we found could be deployed.<br />
                Select one to continue...<br />
                <br />
                {deployables.map((repo) => {
                    const fullName = `${repo.owner}/${repo.name}`;
                    return <Link to={`/deploy/repo/${fullName}`} key={fullName} className={`a-like rounded-full m-1 ${repo.installationRemoteId === '' ? 'bg-yellow-200 hover:bg-yellow-300 text-yellow-700' : 'bg-blue-500 hover:bg-blue-400 font-bold text-white'}`}>{repo.installationRemoteId ? '' : <UilExclamationTriangle className='inline-block h-3 p-0 m-0' />}{fullName}</Link>;
                })}
                <br />
                <br />
                <br />
                Not finding what you are looking for ?<br />
                Make sure your repository contains a <code>klave.json</code> file.<br />
                Try rescanning your repositories after.
                <br />
                <br />
                <button disabled={isWorking} onClick={rescanRepos} className='bg-blue-600 text-white hover:bg-blue-500 rounded-md disabled:text-gray-300'>Rescan</button>
            </> : <>
                We looked hard but could not find anyting to deploy.<br />
                Perhaps try to rescan your repositories<br />
                <br />
                <button disabled={isWorking} onClick={rescanRepos} className='bg-blue-600 text-white hover:bg-blue-500 rounded-md disabled:text-gray-300'>Rescan</button>
            </>}
        </div>
    </>;
};

export default Select;