import { FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { UilSpinner } from '@iconscout/react-unicons';
import { Utils } from '@secretarium/crypto';
import api from '../../utils/api';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import { DeploymentPromotion, DeploymentDeletion } from './deployments';
import RunCommand from '../../components/RunCommand';
import AttestationChecker from '../../components/AttestationChecker';

export const AppDeploymentDetail: FC = () => {

    const { deploymentId } = useParams();
    const [WASMFingerprint, setWASMFingerprint] = useState<string>();
    const { data: deployment, isLoading: isLoadingDeployments } = api.v0.deployments.getById.useQuery({ deploymentId: deploymentId || '' }, {
        refetchInterval: 5000
    });

    useEffect(() => {

        if (!deployment?.buildOutputWASM)
            return;

        crypto.subtle.digest('SHA-256', Utils.fromBase64(deployment.buildOutputWASM)).then((hash) => {
            setWASMFingerprint(Utils.toHex(new Uint8Array(hash)));
        });

    }, [deployment?.buildOutputWASM]);

    if (isLoadingDeployments || !deployment)
        return <>
            We are fetching data about your deployment.<br />
            It will only take a moment...<br />
            <br />
            <UilSpinner className='inline-block animate-spin' />
        </>;

    const { deploymentAddress, createdAt, life, status, version, build, branch } = deployment;

    if (!deploymentAddress)
        return <>
            We experienced an issue fetching your deployment.<br />
        </>;

    const { fqdn } = deploymentAddress;

    return <div className="flex flex-col w-full mb-7">
        <div className="flex w-full justify-between">
            <div className='mb-10'>
                <h2 className='font-bold mb-3'>Addresses of the honest application</h2>
                <span className='font-mono inline-block rounded dark:text-slate-400 dark:bg-slate-800 text-slate-900 bg-slate-100 px-2 py-1 mb-1 whitespace-nowrap'>{fqdn}</span><br />
                <span className={`rounded inline-block text-xs px-1 py-0 mr-2 text-white ${life === 'long' ? 'bg-green-600' : 'bg-slate-500'}`}>{life === 'long' ? 'Production' : 'Preview'}</span>
                <span className={`rounded inline-block text-xs px-1 py-0 text-white ${status === 'errored' ? 'bg-red-700' : status === 'deployed' ? 'bg-blue-500' : 'bg-stone-300'}`}>{status}</span>
            </div>
            <div className='mb-10'>
                <h2 className='font-bold mb-3'>Version</h2>
                <div className="flex items-center">
                    <div className="sm:flex hidden flex-col">
                        <span className='block'>{version ?? '-'}</span>
                        {build ? <span className={'block text-xs text-slate-500'}>{build}</span> : null}
                    </div>
                </div>
            </div>
            <div className='mb-10'>
                <h2 className='font-bold mb-3'>Creation time</h2>
                <div className="flex items-center">
                    <div className="sm:flex hidden flex-col">
                        <span className='block' title={createdAt.toDateString()}>{formatTimeAgo(createdAt)}</span>
                        {life === 'short' ? <span className={'block text-xs text-slate-500'}>Expires {formatTimeAgo(new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * 15))}</span> : <span></span>}
                    </div>
                </div>
            </div>
        </div>
        <div className="flex w-full justify-between">
            <div className='mb-10'>
                <h2 className='font-bold mb-3'>Branch</h2>
                <div className="flex items-center">
                    <div className="sm:flex hidden flex-col">
                        <span className='font-mono inline-block rounded dark:text-slate-400 dark:bg-slate-800 text-slate-900 bg-slate-100 px-2 py-1 mb-1 whitespace-nowrap' title={!branch ? undefined : branch}>{branch?.replace('refs/heads/', '')}</span>
                    </div>
                </div>
            </div>
            <div className='mb-10'>
                <h2 className='font-bold mb-3'>Actions</h2>
                {status === 'deployed' && life !== 'long' ? <>
                    <DeploymentPromotion deployment={deployment} />
                    &nbsp;&nbsp;
                </> : null}
                <DeploymentDeletion deployment={deployment} />
            </div>
        </div>
        {status === 'deployed'
            ? <Tabs.Root defaultValue="inspect" className='flex flex-col w-full'>
                <Tabs.List className='flex flex-shrink-0 border-b'>
                    <Tabs.Trigger value="inspect" className='flex-1 border-0 border-b-2 border-transparent rounded-none data-[state=active]:border-klave-light-blue shadow-none text-sm font-normal text-gray-600 dark:text-gray-400 hover:text-klave-light-blue data-[state=active]:font-bold data-[state=active]:text-klave-light-blue'>Inspect</Tabs.Trigger>
                    <Tabs.Trigger value="dependencies" className='flex-1 border-0 border-b-2 border-transparent rounded-none data-[state=active]:border-klave-light-blue shadow-none text-sm font-normal text-gray-600 dark:text-gray-400 hover:text-klave-light-blue data-[state=active]:font-bold data-[state=active]:text-klave-light-blue'>Dependencies</Tabs.Trigger>
                    <Tabs.Trigger value="attest" className='flex-1 border-0 border-b-2 border-transparent rounded-none data-[state=active]:border-klave-light-blue shadow-none text-sm font-normal text-gray-600 dark:text-gray-400 hover:text-klave-light-blue data-[state=active]:font-bold data-[state=active]:text-klave-light-blue'>Attest</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="inspect">
                    <div className='mt-10'>
                        <RunCommand address={fqdn} functions={deployment.contractFunctions} />
                    </div>
                    <div className='mt-10'>
                        <h2 className='font-bold mb-3'>Code Explorer</h2>
                        <h3 className='mb-3'>Type declarations</h3>
                        <pre className='overflow-auto whitespace-pre-wrap break-words w-full max-w-full bg-slate-100 dark:bg-gray-800 p-3'>
                            {deployment.buildOutputDTS}
                        </pre>
                        <h3 className='mt-5 mb-3'>WASM</h3>
                        <pre className='overflow-auto whitespace-pre-wrap break-words w-full max-w-full bg-slate-100 dark:bg-gray-800 p-3'>
                            SHA256:{WASMFingerprint}
                        </pre>
                        <pre className='overflow-auto whitespace-pre-wrap break-words w-full max-w-full max-h-[50vh] bg-slate-100 dark:bg-gray-800 p-3 mt-2'>
                            {deployment.buildOutputWASM}
                        </pre>
                    </div>
                </Tabs.Content>
                <Tabs.Content value="dependencies">
                    <div className='mt-10'>
                        <h2 className='font-bold mb-3'>List of external dependencies and digests</h2>
                        <pre className='overflow-auto whitespace-pre-wrap break-words w-full max-w-full bg-gray-100 p-3'>
                            {JSON.stringify(deployment.dependenciesManifest, null, 4)}
                        </pre>
                    </div>
                </Tabs.Content>
                <Tabs.Content value="attest">
                    <div className='mt-10'>
                        <AttestationChecker deploymentId={deployment.id} address={fqdn} />
                    </div>
                </Tabs.Content>
            </Tabs.Root>
            : status === 'errored'
                ? <Tabs.Root defaultValue="inspect" className='flex flex-col w-full'>
                    <Tabs.List className='flex flex-shrink-0 border-b'>
                        <Tabs.Trigger value="inspect" className='flex-1 border-0 border-b-2 border-transparent rounded-none data-[state=active]:border-klave-light-blue shadow-none text-sm font-normal text-gray-600 dark:text-gray-400 hover:text-klave-light-blue data-[state=active]:font-bold data-[state=active]:text-klave-light-blue'>Inspect</Tabs.Trigger>
                        <Tabs.Trigger value="dependencies" className='flex-1 border-0 border-b-2 border-transparent rounded-none data-[state=active]:border-klave-light-blue shadow-none text-sm font-normal text-gray-600 dark:text-gray-400 hover:text-klave-light-blue data-[state=active]:font-bold data-[state=active]:text-klave-light-blue'>Dependencies</Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content value="inspect">
                        <div className='mt-10'>
                            <h2 className='font-bold mb-3'>Errors reported during compilation</h2>
                            <pre className='overflow-auto whitespace-pre-wrap break-words w-full max-w-full bg-red-100 p-3'>
                                {(deployment.buildOutputErrorObj as any)?.stack ?? JSON.stringify(deployment.buildOutputErrorObj ?? {}, null, 4)}<br />
                                {(deployment.buildOutputStdErr as any)}
                            </pre>
                        </div>
                    </Tabs.Content>
                    <Tabs.Content value="dependencies">
                        <div className='mt-10'>
                            <h2 className='font-bold mb-3'>List of external dependencies and digests</h2>
                            <pre className='overflow-auto whitespace-pre-wrap break-words w-full max-w-full bg-gray-100 p-3'>
                                {JSON.stringify(deployment.dependenciesManifest, null, 4)}
                            </pre>
                        </div>
                    </Tabs.Content>
                </Tabs.Root>
                : null}
    </div >;
};

export default AppDeploymentDetail;