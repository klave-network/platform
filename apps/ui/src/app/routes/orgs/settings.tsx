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
    const { data: organisation } = api.v0.organisations.getBySlug.useQuery({ orgSlug: orgSlug ?? '' });
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

    const deleteOrganisation = () => {
        (async () => {
            if (organisation)
                await mutation.mutateAsync({
                    organisationId: organisation.id
                });
        })()
            .catch(() => { return; });
    };

    return <AlertDialog.Root>
        <AlertDialog.Trigger asChild>
            <button title='Delete' className="btn btn-md h-8 inline-flex items-center justify-center text-md font-normal text-red-700 mt-auto">
                <UilTrash className='inline-block h-4 w-4' /> Delete
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
                        <input placeholder='Organisation Name' className='input input-bordered w-full' onChange={e => setNameCopy(e.target.value)} />
                    </div>
                </AlertDialog.Description>
                <div className='flex gap-6 justify-end mt-5'>
                    <AlertDialog.Cancel asChild>
                        <button className="btn btn-md h-8">Cancel</button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild disabled={!canSubmit}>
                        <button disabled={!canSubmit} className={`btn btn-md h-8 ${canSubmit ? 'bg-red-700' : 'bg-slate-300'} text-white`} onClick={() => deleteOrganisation()}>Yes, delete organisation</button>
                    </AlertDialog.Action>
                </div>
            </AlertDialog.Content>
        </AlertDialog.Portal>
    </AlertDialog.Root>;
};


export const OrganisationSettings: FC = () => {

    const { orgSlug } = useParams();
    const { data: organisation, isLoading } = api.v0.organisations.getBySlug.useQuery({ orgSlug: orgSlug ?? '' }, {

    });
    const utils = api.useUtils().v0.organisations;
    const mutation = api.v0.organisations.update.useMutation({
        onSuccess: async () => {
            await utils.getBySlug.invalidate();
        }
    });

    const methods = useZodForm({
        schema: z.object({
            slug: z.string()
        }),
        values: {
            slug: organisation?.slug ?? ''
        }
    });

    if (isLoading || !organisation)
        return <>
            We are fetching data about your organisation.<br />
            It will only take a moment...<br />
            <br />
            <UilSpinner className='inline-block animate-spin h-5' />
        </>;

    return <div className="flex flex-col gap-10 w-full justify-start mb-7">
        <form
            onSubmit={(e) => {
                e.preventDefault();
                methods.handleSubmit(async (data) => {
                    await mutation.mutateAsync({ orgSlug: orgSlug ?? '', data });
                    methods.reset();
                })()
                    .catch(() => { return; });
            }}
            className="space-y-2 hidden"
        >
            <div className='flex flex-col gap-3'>
                <label>
                    Slug
                    <br />
                    <textarea {...methods.register('slug')} className="border w-2/3" />
                </label>

                {methods.formState.errors.slug?.message && (
                    <p className="text-red-700">
                        {methods.formState.errors.slug?.message}
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={mutation.isPending}
                className="btn btn-md h-8 border bg-primary-500 p-2"
            >
                {mutation.isPending ? 'Loading' : 'Submit'}
            </button>
        </form>
        <div>
            <h1 className='font-bold text-xl mb-5'>Information</h1>
            <p>
                Name: <b>{organisation.slug.replace('~$~', '')}</b><br />
                ID: <b className='font-mono'>{organisation.id}</b><br />
            </p>
        </div>
        <div>
            <h1 className='text-red-700 font-bold text-xl mb-5'>Danger zone</h1>
            <OrganisationDeletion />
        </div>
    </div>;
};

export default OrganisationSettings;