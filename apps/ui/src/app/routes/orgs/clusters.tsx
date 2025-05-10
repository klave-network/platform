import { FC, MouseEvent as ReactMouseEvent, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { UilGlobe, UilSpinner, UilTrash, UilUserPlus } from '@iconscout/react-unicons';
import api from '../../utils/api';
import { Cluster } from '@klave/db';
// import { useZodForm } from '../../utils/useZodForm';
// import { z } from 'zod';
import { formatTimeAgo } from '../../utils/formatTimeAgo';


const AddCluster = () => {

    const { orgSlug } = useParams();
    const [clusterName, setClusterName] = useState('');
    const [clusterFQDN, setClusterFQDN] = useState('');
    const [canSubmit, setCanSubmit] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string>();
    const { data: organisation } = api.v0.organisations.getBySlug.useQuery({ orgSlug: orgSlug ?? '' });
    const utils = api.useUtils().v0.clusters;
    const addMutation = api.v0.clusters.addCluster.useMutation({
        onError(error) {
            setError(error?.message);
        },
        onSuccess: async () => {
            await utils.getAllocationByOrganisationId.invalidate();
            setIsOpen(false);
        }
    });

    const inviteMember = (event: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => {
        (async () => {
            if (organisation && clusterName.length > 0 && clusterFQDN.length > 0)
                await addMutation.mutateAsync({
                    organisationId: organisation.id,
                    fqdn: clusterFQDN,
                    name: clusterName
                });
        })()
            .catch(() => { return; });
        event.preventDefault();
        return false;
    };

    const setName = (slug: string) => {
        setError(undefined);
        setClusterName(slug);
        setCanSubmit(clusterName.length > 0 && clusterFQDN.length > 0);
    };

    const setFQDN = (slug: string) => {
        setError(undefined);
        setClusterFQDN(slug);
        setCanSubmit(clusterName.length > 0 && clusterFQDN.length > 0);
    };

    const handleOpen = (open: boolean) => {
        setIsOpen(open);
    };

    return <AlertDialog.Root onOpenChange={handleOpen} open={isOpen}>
        <AlertDialog.Trigger asChild>
            <button title='Add a cluster' className="btn btn-md h-8 inline-flex items-center justify-center text-slate-800 text-md font-normal mt-auto">
                <UilUserPlus className='inline-block h-4 w-4' /> Add a cluster
            </button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
            <AlertDialog.Overlay className="AlertDialogOverlay" />
            <AlertDialog.Content className="AlertDialogContent overflow-auto w-[calc(412px)]">
                <AlertDialog.Title className="AlertDialogTitle mb-4">Invite a new member</AlertDialog.Title>
                <AlertDialog.Description className="AlertDialogDescription" asChild>
                    <div>
                        <p className='my-2'>
                            What is the name of the cluster you want to add?
                        </p>
                        <input placeholder='Name' className='input input-bordered w-full' onChange={e => setName(e.target.value)} />
                        <p className='my-2'>
                            What is the Fully Qualified Domain Name (FQDN) of the cluster?
                        </p>
                        <input placeholder='FQDN' className='input input-bordered w-full' onChange={e => setFQDN(e.target.value)} />
                    </div>
                </AlertDialog.Description>
                {error
                    ? <div className='flex gap-6 text-sm bg-red-100 p-3 mt-5'>{error}</div>
                    : null}
                <div className='flex gap-6 justify-end mt-5'>
                    <AlertDialog.Cancel asChild>
                        <button className="btn btn-md h-8 ">{'Cancel'}</button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild disabled={!canSubmit}>
                        <button disabled={!canSubmit} className={`btn btn-md h-8  ${canSubmit ? 'bg-red-700' : 'bg-slate-300'} text-white`} onClick={(e) => inviteMember(e)}>Invite</button>
                    </AlertDialog.Action>
                </div>
            </AlertDialog.Content>
        </AlertDialog.Portal>
    </AlertDialog.Root>;
};

type ClusterContextProps = {
    cluster: Cluster
};

const ClusterDeletion: FC<ClusterContextProps> = ({ cluster: { id } }) => {

    const utils = api.useUtils().v0.clusters;
    const mutation = api.v0.clusters.delete.useMutation({
        onSuccess: async () => {
            await utils.getAllocationByDeploymentId.invalidate();
        }
    });

    const deleteCluster = (clusterId: Cluster['id']) => {
        (async () => {
            await mutation.mutateAsync({ clusterId });
        })().catch(() => { return; });
    };

    return <AlertDialog.Root>
        <AlertDialog.Trigger asChild>
            <button title='Delete' className="btn btn-md h-8 inline-flex items-center justify-center font-normal text-red-400 mt-auto">
                <UilTrash className='inline-block h-4 w-4' />
            </button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
            <AlertDialog.Overlay className="AlertDialogOverlay" />
            <AlertDialog.Content className="AlertDialogContent">
                <AlertDialog.Title className="AlertDialogTitle">Are you absolutely sure?</AlertDialog.Title>
                <AlertDialog.Description className="AlertDialogDescription">
                    This action cannot be undone. This will permanently delete this cluster.
                </AlertDialog.Description>
                <div className='flex gap-6 justify-end mt-5'>
                    <AlertDialog.Cancel asChild>
                        <button className="btn btn-md h-8">Cancel</button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild>
                        <button className="btn btn-md h-8 bg-red-700 text-white" onClick={() => deleteCluster(id)}>Yes, delete cluster</button>
                    </AlertDialog.Action>
                </div>
            </AlertDialog.Content>
        </AlertDialog.Portal>
    </AlertDialog.Root>;
};

type ClusterRecordProps = {
    cluster: Cluster
};

const ClusterRecord: FC<ClusterRecordProps> = ({ cluster }) => {

    const { id, name, fqdn, updatedAt } = cluster;

    return <tr>
        <td className="sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800 md:table-cell hidden">
            <div className="flex items-center">
                <UilGlobe className='inline-block h-5' />
            </div>
        </td>
        <td className="sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800">{name}</td>
        <td className="sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800">{id}</td>
        <td className="sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800">{fqdn}</td>
        {/* <td className={`sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800 ${verified ? 'text-green-500' : 'text-red-500'}`}>{verified ? <UilCheckCircle className='h-5' /> : <UilTimesCircle className='h-5' />}</td> */}
        <td className="sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800 md:table-cell hidden">
            <div className="flex items-center">
                <div className="sm:flex hidden flex-col" title={updatedAt.toDateString()}>
                    {formatTimeAgo(updatedAt)}
                    <div className="text-gray-400 text-xs">{updatedAt.toUTCString()}</div>
                </div>
            </div>
        </td>
        <td className="sm:p-3 py-2 px-1 border-b border-gray-200 dark:border-gray-800 text-right">
            <div className='flex flex-row flex-nowrap justify-end'>
                <ClusterDeletion cluster={cluster} />
            </div>
        </td>
    </tr>;
};

export const ClusterListing: FC = () => {

    const { orgSlug } = useParams();
    const { data: organisation } = api.v0.organisations.getBySlug.useQuery({ orgSlug: orgSlug ?? '' });
    const { data: clustersAllocationList, isLoading } = api.v0.clusters.getAllocationByOrganisationId.useQuery({ organisationId: organisation?.id ?? '' });

    if (isLoading || !clustersAllocationList)
        return <>
            We are fetching data about your clusters.<br />
            It will only take a moment...<br />
            <br />
            <UilSpinner className='inline-block animate-spin h-5' />
        </>;

    return <div className="flex flex-col w-full justify-start mb-7">
        <h1 className='font-bold text-xl mb-5'>Custom clusters</h1>
        <div className='mb-6'>
            <AddCluster />
        </div>
        <table className="w-full text-left">
            <thead>
                <tr className="text-gray-400">
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800 hidden md:table-cell"></th>
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Name</th>
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Cluster</th>
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">FQDN</th>
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800 hidden md:table-cell">Last update</th>
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800 sm:text-gray-400 text-white text-right">Action</th>
                </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-100">
                {clustersAllocationList
                    .sort((a, b) => a.cluster.name.toLocaleLowerCase().localeCompare(b.cluster.name))
                    .map(allocation => <ClusterRecord key={allocation.id} cluster={allocation.cluster} />)}
            </tbody>
        </table>
    </div>;
};

export default ClusterListing;