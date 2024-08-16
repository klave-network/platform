import { FC, Fragment, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { UilSpinner, UilTrash } from '@iconscout/react-unicons';
import api from '../../utils/api';
import { Deployment } from '@klave/db';
import { formatTimeAgo } from '../../utils/formatTimeAgo';

type DeploymentContextProps = {
    deployment: Omit<Deployment, 'buildOutputDTS' | 'buildOutputWASM' | 'buildOutputWAT' | 'buildOutputs' | 'configSnapshot'>
};

export const DeploymentPromotion: FC<DeploymentContextProps> = ({ deployment: { id } }) => {

    const navigate = useNavigate();
    const { orgSlug, appSlug } = useParams();
    const utils = api.useUtils().v0.deployments;
    const mutation = api.v0.deployments.release.useMutation({
        onSuccess: async () => {
            await utils.getByApplication.invalidate();
            await utils.getAll.invalidate();
        }
    });

    const promoteDeployment = (deploymentId: Deployment['id']) => {
        (async () => {
            await mutation.mutateAsync({ deploymentId });
            navigate(`/${orgSlug}/${appSlug}/deployments`);
        })().catch(() => { return; });
    };

    return <AlertDialog.Root>
        <AlertDialog.Trigger asChild onClick={e => e.stopPropagation()}>
            <button title='Release' className="btn btn-sm h-8 inline-flex items-center justify-center font-normal ml-auto">
                Release
            </button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
            <AlertDialog.Overlay className="AlertDialogOverlay" onClick={e => { e.stopPropagation(); }} />
            <AlertDialog.Content className="AlertDialogContent" onClick={e => { e.stopPropagation(); }}>
                <AlertDialog.Title className="AlertDialogTitle">Are you absolutely sure?</AlertDialog.Title>
                <AlertDialog.Description className="AlertDialogDescription">
                    This will promote the deployment to a production status and will trigger the migration of
                    data from the existing ledger to the new instance.
                </AlertDialog.Description>
                <div className='flex gap-6 justify-end mt-5'>
                    <AlertDialog.Cancel asChild>
                        <button className="btn btn-sm">Cancel</button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild>
                        <button className='btn btn-sm' onClick={() => promoteDeployment(id)}>Yes, release</button>
                    </AlertDialog.Action>
                </div>
            </AlertDialog.Content>
        </AlertDialog.Portal>
    </AlertDialog.Root>;
};

export const DeploymentDeletion: FC<DeploymentContextProps> = ({ deployment: { id } }) => {

    const navigate = useNavigate();
    const { orgSlug, appSlug } = useParams();
    const utils = api.useUtils().v0.deployments;
    const mutation = api.v0.deployments.delete.useMutation({
        onSuccess: async () => {
            await utils.getByApplication.invalidate();
            await utils.getAll.invalidate();
        }
    });

    const deleteDeployment = (deploymentId: Deployment['id']) => {
        (async () => {
            await mutation.mutateAsync({ deploymentId });
            navigate(`/${orgSlug}/${appSlug}/deployments`);
        })().catch(() => { return; });
    };

    return <AlertDialog.Root>
        <AlertDialog.Trigger asChild onClick={e => { e.stopPropagation(); }}>
            <button title='Delete' className="btn btn-sm h-8 inline-flex items-center justify-center font-normal text-red-400 mt-auto">
                <UilTrash className='inline-block h-4 w-4' />
            </button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
            <AlertDialog.Overlay className="AlertDialogOverlay" onClick={e => { e.stopPropagation(); }} />
            <AlertDialog.Content className="AlertDialogContent" onClick={e => { e.stopPropagation(); }}>
                <AlertDialog.Title className="AlertDialogTitle">Are you absolutely sure?</AlertDialog.Title>
                <AlertDialog.Description className="AlertDialogDescription">
                    This action cannot be undone. This will permanently delete this deployment and remove the
                    data attached to this deployment.
                </AlertDialog.Description>
                <div className='flex gap-6 justify-end mt-5'>
                    <AlertDialog.Cancel asChild>
                        <button className="btn btn-sm">Cancel</button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild>
                        <button className="btn btn-sm bg-red-700 text-white" onClick={() => deleteDeployment(id)}>Yes, delete deployment</button>
                    </AlertDialog.Action>
                </div>
            </AlertDialog.Content>
        </AlertDialog.Portal>
    </AlertDialog.Root>;
};

export const Deployments: FC = () => {

    const navigate = useNavigate();
    const { appSlug, orgSlug } = useParams();
    const { data: application } = api.v0.applications.getBySlug.useQuery({ appSlug: appSlug || '', orgSlug: orgSlug || '' });
    const { data: deploymentList, isLoading: isLoadingDeployments } = api.v0.deployments.getByApplication.useQuery({ appId: application?.id || '' }, {
        refetchInterval: (s) => s.state.data?.find(d => !['errored', 'terminated', 'deployed'].includes(d.status ?? '')) === undefined ? 5000 : 500
    });

    // const deployments = useMemo(() => {
    //     return deploymentList?.sort((a, b) => a.createdAt > b.createdAt ? -1 : 1) ?? [];
    // }, [deploymentList]);

    const deploymentSets = useMemo(() => {

        const sets = deploymentList?.reduce((acc, deployment) => {
            const set = acc[deployment.set];
            if (set) {
                set.deployments.push(deployment);
                if (set.earliestCreation.getTime() < deployment.createdAt.getTime())
                    set.earliestCreation = deployment.createdAt;
            }
            else
                acc[deployment.set] = {
                    deployments: [deployment],
                    earliestCreation: deployment.createdAt
                };
            return acc;
        }, {} as Record<string, { deployments: (typeof deploymentList)[number][], earliestCreation: Date }>);

        return Object.values(sets ?? {}).sort((a, b) => a.earliestCreation > b.earliestCreation ? -1 : 1);

    }, [deploymentList]);

    if (isLoadingDeployments || !deploymentList)
        return <>
            We are fetching data about your deployments.<br />
            It will only take a moment...<br />
            <br />
            <UilSpinner className='inline-block animate-spin' />
        </>;

    return <>
        <div className="hidden w-full items-center mb-7">
            <button className="btn btn-sm inline-flex mr-3 items-center h-8 pl-2.5 pr-2 rounded-md shadow dark:text-slate-400 dark:bg-slate-800 text-gray-700 dark:border-gray-800 border border-gray-200 leading-none py-0">
                <svg viewBox="0 0 24 24" className="w-4 mr-2 text-gray-400 dark:text-gray-600" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Last 30 days
                <svg viewBox="0 0 24 24" className="w-4 ml-1.5 text-gray-400 dark:text-gray-600" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
        </div>
        <table className="w-full text-left">
            <thead>
                <tr className="text-gray-400">
                    {/* <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800 hidden md:table-cell"></th> */}
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Address</th>
                    {/* <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Type</th> */}
                    {/* <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Status</th> */}
                    {/* <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Version</th> */}
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Version</th>
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Branch</th>
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800 hidden md:table-cell">Dates</th>
                    {/* <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800 hidden md:table-cell">Created</th> */}
                    {/* <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Expires</th> */}
                    {/* <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800 sm:text-gray-400 text-white text-right">Action</th> */}
                </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-100">
                {deploymentSets.map(({ deployments, earliestCreation: setCreation }) => {
                    const setId = deployments[0]?.set;
                    const setBuild = deployments[0]?.build;
                    const setBranch = deployments[0]?.branch;
                    const setVersion = deployments[0]?.version;
                    const hasDeploying = deployments.some(({ status }) => ['created', 'deploying', 'terminating'].includes(status));
                    return <tr key={setId} className={hasDeploying ? 'stripe-progress' : ''}>
                        <td className={'sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800 grid'}>
                            {deployments.map(deployment => {
                                const { id, deploymentAddress, expiresOn, life, status } = deployment;
                                const hasExpired = new Date().getTime() > expiresOn.getTime();

                                if (!deploymentAddress?.fqdn)
                                    return null;
                                return <div key={id} onClick={() => navigate(`./${id}`)} className='mb-3'>
                                    <span className='font-mono inline-block rounded dark:text-slate-400 dark:bg-slate-800 text-slate-900 bg-slate-100 px-2 py-1 mb-1 whitespace-nowrap hover:cursor-pointer hover:bg-klave-dark-blue hover:text-slate-100'>{deploymentAddress.fqdn}</span><br />
                                    <span className={`rounded inline-block text-xs px-1 py-0 mr-2 text-white ${life === 'long' ? 'bg-green-600' : 'bg-slate-500'}`}>{life === 'long' ? 'Production' : 'Preview'}</span>
                                    <span className={`rounded inline-block text-xs px-1 py-0 text-white ${status === 'errored' ? 'bg-red-700' : status === 'deployed' ? 'bg-blue-500' : 'bg-stone-300'}`}>{status}</span>
                                    {life === 'short' ? <span className={'inline-block text-xs text-slate-500 px-2'}>{hasExpired ? 'Expired' : 'Expires'} {formatTimeAgo(expiresOn)}</span> : <span></span>}
                                </div>;
                            })
                            }
                        </td>
                        <td className="sm:p-3 py-2 px-1 align-top border-b border-gray-200 dark:border-gray-800 md:table-cell hidden">
                            <div className="flex items-center">
                                <div className="sm:flex hidden flex-col">
                                    <span className='block'>{setVersion ?? '-'}</span>
                                    {setBuild ? <span className={'block text-xs text-slate-500'}>{setBuild}</span> : null}
                                </div>
                            </div>
                        </td>
                        <td className="sm:p-3 py-2 px-1 align-top border-b border-gray-200 dark:border-gray-800 md:table-cell hidden">
                            <div className="flex items-center">
                                <div className="sm:flex hidden flex-col">
                                    <span className='font-mono inline-block rounded dark:text-slate-400 dark:bg-slate-800 text-slate-900 bg-slate-100 px-2 py-1 mb-1 whitespace-nowrap' title={!setBranch ? undefined : setBranch}>{setBranch?.replace('refs/heads/', '')}</span><br />
                                </div>
                            </div>
                        </td>
                        <td className="sm:p-3 py-2 px-1 align-top border-b border-gray-200 dark:border-gray-800 md:table-cell hidden">
                            <div className="flex items-center">
                                <div className="sm:flex hidden flex-col">
                                    <span className='block' title={setCreation.toDateString()}>{formatTimeAgo(setCreation)}</span>
                                    {/* {life === 'short' ? <span className={'block text-xs text-slate-500'}>Expires {formatTimeAgo(deployment.expiresOn)}</span> : <span></span>} */}
                                </div>
                            </div>
                        </td>
                        {/*
                                <td className="sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800 md:table-cell hidden">
                                    <div className="flex items-center">
                                        <div className="sm:flex hidden flex-col" title={createdAt.toDateString()}>
                                            {formatTimeAgo(createdAt)}
                                        </div>
                                    </div>
                                </td>
                                <td className="sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800">
                                    <div className="flex items-center">
                                        <div className="sm:flex hidden flex-col" title={createdAt.toDateString()}>
                                            {formatTimeAgo(new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * 15))}
                                        </div>
                                    </div>
                                </td>
                                */}
                    </tr>;
                })}
            </tbody>
        </table >
        <table className="hidden w-full text-left">
            <thead>
                <tr className="text-gray-400">
                    {/* <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800 hidden md:table-cell"></th> */}
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Address</th>
                    {/* <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Type</th> */}
                    {/* <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Status</th> */}
                    {/* <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Version</th> */}
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Version</th>
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Branch</th>
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800 hidden md:table-cell">Dates</th>
                    {/* <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800 hidden md:table-cell">Created</th> */}
                    {/* <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Expires</th> */}
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800 sm:text-gray-400 text-white text-right">Action</th>
                </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-100">
                {deploymentSets.map(({ deployments }) => {
                    return <Fragment key={deployments[0]?.set}>
                        {deployments.map(deployment => {
                            const { id, deploymentAddress, createdAt, life, status, version, build, branch } = deployment;
                            if (!deploymentAddress?.fqdn)
                                return null;
                            return <tr key={id} className={['created', 'deploying', 'terminating'].includes(status) ? 'stripe-progress' : 'hover:bg-slate-50 hover:cursor-pointer'} onClick={() => navigate(`./${id}`)}>
                                {/*
                                <td className="sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800 md:table-cell hidden">
                                    <div className="flex items-center">
                                        <UilServerNetworkAlt className='inline-block h-4 w-4' />
                                    </div>
                                </td>
                                */}
                                <td className={'sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800'}>
                                    <span className='font-mono inline-block rounded dark:text-slate-400 dark:bg-slate-800 text-slate-900 bg-slate-100 px-2 py-1 mb-1 whitespace-nowrap'>{deploymentAddress.fqdn}</span><br />
                                    <span className={`rounded inline-block text-xs px-1 py-0 mr-2 text-white ${life === 'long' ? 'bg-green-600' : 'bg-slate-500'}`}>{life === 'long' ? 'Production' : 'Preview'}</span>
                                    <span className={`rounded inline-block text-xs px-1 py-0 text-white ${status === 'errored' ? 'bg-red-700' : status === 'deployed' ? 'bg-blue-500' : 'bg-stone-300'}`}>{status}</span>
                                </td>
                                {/* <td className="sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800">{life === 'long' ? 'prod' : 'dev'}</td> */}
                                {/* <td className={'sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800'}>{status}</td> */}
                                {/* <td className={'sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800'}><span className='font-mono rounded bg-slate-100 px-2 py-1 whitespace-nowrap'>1.0.3</span></td> */}
                                <td className="sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800 md:table-cell hidden">
                                    <div className="flex items-center">
                                        <div className="sm:flex hidden flex-col">
                                            <span className='block'>{version ?? '-'}</span>
                                            {build ? <span className={'block text-xs text-slate-500'}>{build}</span> : null}
                                        </div>
                                    </div>
                                </td>
                                <td className="sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800 md:table-cell hidden">
                                    <div className="flex items-center">
                                        <div className="sm:flex hidden flex-col">
                                            <span className='font-mono inline-block rounded dark:text-slate-400 dark:bg-slate-800 text-slate-900 bg-slate-100 px-2 py-1 mb-1 whitespace-nowrap' title={!branch ? undefined : branch}>{branch?.replace('refs/heads/', '')}</span><br />
                                        </div>
                                    </div>
                                </td>
                                <td className="sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800 md:table-cell hidden">
                                    <div className="flex items-center">
                                        <div className="sm:flex hidden flex-col">
                                            <span className='block' title={createdAt.toDateString()}>{formatTimeAgo(createdAt)}</span>
                                            {life === 'short' ? <span className={'block text-xs text-slate-500'}>Expires {formatTimeAgo(deployment.expiresOn)}</span> : <span></span>}
                                        </div>
                                    </div>
                                </td>
                                {/*
                                <td className="sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800 md:table-cell hidden">
                                    <div className="flex items-center">
                                        <div className="sm:flex hidden flex-col" title={createdAt.toDateString()}>
                                            {formatTimeAgo(createdAt)}
                                        </div>
                                    </div>
                                </td>
                                <td className="sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800">
                                    <div className="flex items-center">
                                        <div className="sm:flex hidden flex-col" title={createdAt.toDateString()}>
                                            {formatTimeAgo(new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * 15))}
                                        </div>
                                    </div>
                                </td>
                                */}
                                <td className="sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800 text-right">
                                    <div className='flex flex-row flex-nowrap justify-end'>
                                        {/*
                                        {status === 'deployed' && life !== 'long' ? <>
                                            <DeploymentPromotion deployment={deployment} />
                                            &nbsp;&nbsp;
                                        </> : null}
                                        */}
                                        <DeploymentDeletion deployment={deployment} />
                                    </div>
                                </td>
                            </tr>;
                        })}
                    </Fragment>;
                })}
            </tbody>
        </table >
    </>;
};

export default Deployments;