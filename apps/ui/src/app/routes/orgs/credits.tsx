import { FC, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { UilSpinner, Uil0Plus } from '@iconscout/react-unicons';
import api from '../../utils/api';
// import { useZodForm } from '../../utils/useZodForm';
// import { z } from 'zod';
import { useEffect } from 'react';

const OrganisationAddCredit = () => {

    // const navigate = useNavigate();
    const { orgSlug } = useParams();
    const [nameCopy, setNameCopy] = useState('');
    const [canSubmit, setCanSubmit] = useState(false);
    // const utils = api.useUtils().v0.organisations;
    // const mutation = api.v0.organisations.delete.useMutation({
    //     onSuccess: async () => {
    //         await utils.getAll.invalidate();
    //         await utils.getById.invalidate();
    //         navigate('/app');
    //     }
    // });

    useEffect(() => {
        setCanSubmit(nameCopy === orgSlug);
    }, [nameCopy, orgSlug]);

    const deleteOrganisation = async () => {
        // if (orgId)
        //     await mutation.mutateAsync({
        //         organisationId: orgId
        //     });
    };

    return <AlertDialog.Root>
        <AlertDialog.Trigger asChild>
            <button title='Delete' className="mt-3 h-8 inline-flex items-center justify-center text-slate-500 text-md font-normalmt-auto">
                <Uil0Plus className='inline-block h-full' /> Add credits
            </button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
            <AlertDialog.Overlay className="AlertDialogOverlay" />
            <AlertDialog.Content className="AlertDialogContent">
                <AlertDialog.Title className="AlertDialogTitle">Add credit to your organisation</AlertDialog.Title>
                <AlertDialog.Description className="AlertDialogDescription">
                    <p className='my-2'>
                        This action cannot be undone. This will permanently delete this organisation and all attached data.
                    </p>
                    <p className='my-2'>
                        If you are really sure you want to delete this organisation, please type the organisation ID below.
                    </p>
                    <p className='my-2'>
                        <code className='font-bold'>{orgSlug}</code>
                    </p>
                    <input placeholder='Organisation ID' className='w-full' onChange={e => setNameCopy(e.target.value)} />
                </AlertDialog.Description>
                <div style={{ display: 'flex', gap: 25, justifyContent: 'flex-end' }}>
                    <AlertDialog.Cancel asChild>
                        <button className="Button">Cancel</button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild disabled={!canSubmit}>
                        <button disabled={!canSubmit} className={`Button ${canSubmit ? 'bg-red-700' : 'bg-slate-300'} text-white`} onClick={() => deleteOrganisation()}>Yes, delete organisation</button>
                    </AlertDialog.Action>
                </div>
            </AlertDialog.Content>
        </AlertDialog.Portal>
    </AlertDialog.Root>;
};


export const OrganisationSettings: FC = () => {

    const { orgSlug } = useParams();
    const { data: organisation, isLoading } = api.v0.organisations.getBySlug.useQuery({ orgSlug: orgSlug || '' });
    const { data: applicationsList, isLoading: isLoadingApps } = api.v0.applications.getByOrganisation.useQuery({ orgSlug: orgSlug || '' });
    const sortedApplications = useMemo(() => (applicationsList ?? []).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), [applicationsList])

    // const utils = api.useUtils().v0.organisations;
    // const mutation = api.v0.organisations.update.useMutation({
    //     onSuccess: async () => {
    //         await utils.getBySlug.invalidate();
    //     }
    // });

    // const methods = useZodForm({
    //     schema: z.object({
    //         name: z.string(),
    //         slug: z.string()
    //     }),
    //     values: {
    //         name: organisation?.name || '',
    //         slug: organisation?.slug || ''
    //     }
    // });

    if (isLoading || !organisation)
        return <>
            We are fetching data about your organisation.<br />
            It will only take a moment...<br />
            <br />
            <UilSpinner className='inline-block animate-spin' />
        </>;

    return <div className="flex flex-col gap-10 w-full justify-start mb-7">
        <div>
            <h1 className='font-bold text-xl mb-5'>Total Balance</h1>
            <p>
                Balance: <b>{parseFloat(organisation.kredits.toString()).toFixed(3)}</b><br />
                <OrganisationAddCredit />
            </p>
        </div>
        <div>
            <h1 className='font-bold text-xl mb-5'>Application allocations</h1>
            {isLoadingApps
                ? <><UilSpinner className='inline-block animate-spin' /></>
                : <><div className='flex flex-row gap-3 bg-slate-100 border-slate-100 border rounded-sm p-2'>
                    <div className='flex flex-col gap-1 grow'>
                        Application
                    </div>
                    <div className='flex flex-col gap-1 items-center'>
                        Balance
                    </div>
                </div>
                    {sortedApplications?.map((application, i) =>
                        <div key={i} className='flex flex-row gap-3 border-slate-100 border border-t-0 rounded-sm p-2'>
                            <div className='flex flex-col gap-1 grow'>
                                <p className='font-bold'>{application?.name}</p>
                                <p>{application.slug}</p>
                            </div>
                            <div className='flex flex-col gap-1 items-center'>
                                <p className='font-bold'>{parseFloat(application.kredits.toString()).toFixed(3)}</p>
                            </div>
                        </div>

                    )}
                </>}
        </div>
    </div>;
};

export default OrganisationSettings;