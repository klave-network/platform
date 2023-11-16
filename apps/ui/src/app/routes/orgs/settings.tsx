import { FC, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { UilSpinner, UilTrash } from '@iconscout/react-unicons';
import api from '../../utils/api';
import { useZodForm } from '../../utils/useZodForm';
import { z } from 'zod';
import { useEffect } from 'react';

const OrganisationDeletion = () => {

    const navigate = useNavigate();
    const { orgSlug } = useParams();
    const [nameCopy, setNameCopy] = useState('');
    const [canSubmit, setCanSubmit] = useState(false);
    const { data: organisation } = api.v0.organisations.getBySlug.useQuery({ orgSlug: orgSlug || '' });
    const utils = api.useUtils().v0.organisations;
    const mutation = api.v0.organisations.delete.useMutation({
        onSuccess: async () => {
            await utils.getAll.invalidate();
            await utils.getById.invalidate();
            await utils.getBySlug.invalidate();
            navigate('/');
        }
    });

    useEffect(() => {
        setCanSubmit(nameCopy === orgSlug);
    }, [nameCopy, orgSlug]);

    const deleteOrganisation = async () => {
        if (organisation)
            await mutation.mutateAsync({
                organisationId: organisation.id
            });
    };

    return <AlertDialog.Root>
        <AlertDialog.Trigger asChild>
            <button title='Delete' className="h-8 inline-flex items-center justify-center text-md font-normal text-red-700 mt-auto">
                <UilTrash className='inline-block h-full' /> Delete
            </button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
            <AlertDialog.Overlay className="AlertDialogOverlay" />
            <AlertDialog.Content className="AlertDialogContent">
                <AlertDialog.Title className="AlertDialogTitle">Are you absolutely sure?</AlertDialog.Title>
                <AlertDialog.Description className="AlertDialogDescription" asChild>
                    <div>
                        <p className='my-2'>
                            This action cannot be undone. This will permanently delete this organisation and all attached data.
                        </p>
                        <p className='my-2'>
                            If you are really sure you want to delete this organisation, please type the organisation name below.
                        </p>
                        <p className='my-2'>
                            <code className='font-bold'>{orgSlug}</code>
                        </p>
                        <input placeholder='Organisation Name' className='w-full' onChange={e => setNameCopy(e.target.value)} />
                    </div>
                </AlertDialog.Description>
                <div className='flex gap-6 justify-end mt-5'>
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
    const { data: organisation, isLoading } = api.v0.organisations.getBySlug.useQuery({ orgSlug: orgSlug || '' }, {

    });
    const utils = api.useUtils().v0.organisations;
    const mutation = api.v0.organisations.update.useMutation({
        onSuccess: async () => {
            await utils.getBySlug.invalidate();
        }
    });

    const methods = useZodForm({
        schema: z.object({
            name: z.string(),
            slug: z.string()
        }),
        values: {
            name: organisation?.name || '',
            slug: organisation?.slug || ''
        }
    });

    if (isLoading || !organisation)
        return <>
            We are fetching data about your organisation.<br />
            It will only take a moment...<br />
            <br />
            <UilSpinner className='inline-block animate-spin' />
        </>;

    return <div className="flex flex-col gap-10 w-full justify-start mb-7">
        <form
            onSubmit={methods.handleSubmit(async (data) => {
                await mutation.mutateAsync({ orgSlug: orgSlug || '', data });
                methods.reset();
            })}
            className="space-y-2 hidden"
        >
            <div className='flex flex-col gap-3'>
                <label>
                    Name
                    <br />
                    <input {...methods.register('name')} className="border w-2/3" />
                </label>
                <label>
                    Slug
                    <br />
                    <textarea {...methods.register('slug')} className="border w-2/3" />
                </label>

                {methods.formState.errors.name?.message && (
                    <p className="text-red-700">
                        {methods.formState.errors.name?.message}
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={mutation.isPending}
                className="border bg-primary-500 p-2"
            >
                {mutation.isPending ? 'Loading' : 'Submit'}
            </button>
        </form>
        <div>
            <h1 className='font-bold text-xl mb-5'>Repository information</h1>
            <p>
                Name: <b>{organisation.name}</b><br />
                Slug: <b>{organisation.slug.replace('~$~', '')}</b><br />
            </p>
        </div>
        <div>
            <h1 className='font-bold text-xl mb-5'>Credit allocation</h1>
            <p>
                Balance: <b>{parseFloat(organisation.kredits.toString()) / 10_000}</b><br />
            </p>
        </div>
        <div>
            <h1 className='font-bold text-xl mb-5'>Manage Access</h1>
            <div className='flex flex-row gap-3 bg-slate-100 border-slate-100 border rounded-sm p-2'>
                <div className='flex flex-col gap-1 grow'>
                    Name
                </div>
                <div className='flex flex-col gap-1 items-center'>
                    Permission
                </div>
            </div>
            {organisation.permissionGrants?.map((grant, i) =>
                <div key={i} className='flex flex-row gap-3 border-slate-100 border border-t-0 rounded-sm p-2'>
                    <div className='flex flex-col gap-1 grow'>
                        <p className='font-bold'>{grant.user.slug.replace('~$~', '')}</p>
                        <p>{grant.userId ?? grant.organisationId}</p>
                    </div>
                    <div className='flex flex-col gap-1 items-center'>
                        <p className='font-bold'>{organisation.personal ? 'Owner' : grant.admin ? 'Admin' : grant.write ? 'Write' : grant.read ? 'Read' : 'Unknown'}</p>
                    </div>
                </div>

            )}
        </div>
        <div>
            <h1 className='text-red-700 font-bold text-xl mb-5'>Danger zone</h1>
            <OrganisationDeletion />
        </div>
    </div>;
};

export default OrganisationSettings;