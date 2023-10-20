import { FC, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { UilSpinner, UilTrash } from '@iconscout/react-unicons';
import api from '../../utils/api';
import { useZodForm } from '../../utils/useZodForm';
import { z } from 'zod';
import { useEffect } from 'react';

const ApplicationDeletion = () => {

    const navigate = useNavigate();
    const { appId } = useParams();
    const [nameCopy, setNameCopy] = useState('');
    const [canSubmit, setCanSubmit] = useState(false);
    const utils = api.useContext().v0.applications;
    const mutation = api.v0.applications.delete.useMutation({
        onSuccess: async () => {
            await utils.getAll.invalidate();
            await utils.getById.invalidate();
            navigate('/app');
        }
    });

    useEffect(() => {
        setCanSubmit(nameCopy === appId);
    }, [nameCopy, appId]);

    const deleteApplication = async () => {
        if (appId)
            await mutation.mutateAsync({
                applicationId: appId
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
                <AlertDialog.Description className="AlertDialogDescription">
                    <p className='my-2'>
                        This action cannot be undone. This will permanently delete this application and all attached data.
                    </p>
                    <p className='my-2'>
                        If you are really sure you want to delete this application, please type the application ID below.
                    </p>
                    <p className='my-2'>
                        <code className='font-bold'>{appId}</code>
                    </p>
                    <input placeholder='Application ID' className='w-full' onChange={e => setNameCopy(e.target.value)} />
                </AlertDialog.Description>
                <div style={{ display: 'flex', gap: 25, justifyContent: 'flex-end' }}>
                    <AlertDialog.Cancel asChild>
                        <button className="Button">Cancel</button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild disabled={!canSubmit}>
                        <button disabled={!canSubmit} className={`Button ${canSubmit ? 'bg-red-700' : 'bg-slate-300'} text-white`} onClick={() => deleteApplication()}>Yes, delete application</button>
                    </AlertDialog.Action>
                </div>
            </AlertDialog.Content>
        </AlertDialog.Portal>
    </AlertDialog.Root>;
};


export const AppSettings: FC = () => {

    const { appId } = useParams();
    const { data: application, isLoading } = api.v0.applications.getById.useQuery({ appId: appId || '' });
    const utils = api.useContext().v0.applications;
    const mutation = api.v0.applications.update.useMutation({
        onSuccess: async () => {
            await utils.getById.invalidate();
        }
    });

    const methods = useZodForm({
        schema: z.object({
            homepage: z.string(),
            description: z.string(),
            license: z.string(),
            webhook: z.string()
        }),
        values: {
            homepage: application?.homepage || '',
            description: application?.description || '',
            license: application?.license || '',
            webhook: application?.webhook || ''
        }
    });

    if (isLoading || !application)
        return <>
            We are fetching data about your application.<br />
            It will only take a moment...<br />
            <br />
            <UilSpinner className='inline-block animate-spin' />
        </>;

    return <div className="flex flex-col gap-10 w-full justify-start mb-7">
        <form
            onSubmit={methods.handleSubmit(async (data) => {
                await mutation.mutateAsync({ appId: appId || '', data });
                methods.reset();
            })}
            className="space-y-2 hidden"
        >
            <div className='flex flex-col gap-3'>
                <label>
                    Homepage
                    <br />
                    <input {...methods.register('homepage')} className="border w-2/3" />
                </label>
                <label>
                    Description
                    <br />
                    <textarea {...methods.register('description')} className="border w-2/3" />
                </label>
                <label>
                    License
                    <br />
                    <select {...methods.register('license')} className="select select-bordered w-2/3">
                        <option>MIT</option>
                        <option>Apache 2.0</option>
                        <option>BSD</option>
                    </select>
                </label>
                <label>
                    Webhook
                    <br />
                    <input {...methods.register('webhook')} className="border w-2/3" />
                </label>

                {methods.formState.errors.homepage?.message && (
                    <p className="text-red-700">
                        {methods.formState.errors.homepage?.message}
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={mutation.isLoading}
                className="border bg-primary-500 p-2"
            >
                {mutation.isLoading ? 'Loading' : 'Submit'}
            </button>
        </form>
        <div>
            <h1 className='font-bold text-xl mb-5'>Repository information</h1>
            <p>
                Source: <b>{application.repo.source}</b><br />
                Owner: <b>{application.repo.owner}</b><br />
                Name: <b>{application.repo.name}</b><br />
                Default branch: <b>{application.repo.defaultBranch ?? 'master'}</b><br />
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
            {application.permissionGrants?.map((grant, i) =>
                <div key={i} className='flex flex-row gap-3 border-slate-100 border border-t-0 rounded-sm p-2'>
                    <div className='flex flex-col gap-1 grow'>
                        <p className='font-bold'>{grant.user?.emails?.[0] ?? grant.organisation?.name}</p>
                        <p>{grant.userId ?? grant.organisationId}</p>
                    </div>
                    <div className='flex flex-col gap-1 items-center'>
                        <p className='font-bold'>{grant.admin ? 'Admin' : grant.write ? 'Write' : grant.read ? 'Read' : 'Unknown'}</p>
                    </div>
                </div>

            )}
        </div>
        <div>
            <h1 className='text-red-700 font-bold text-xl mb-5'>Danger zone</h1>
            <ApplicationDeletion />
        </div>
    </div>;
};

export default AppSettings;