import { ChangeEvent, FC, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { UilEdit, UilSpinner, UilTrash } from '@iconscout/react-unicons';
import api from '../../utils/api';
import { useZodForm } from '../../utils/useZodForm';
import { z } from 'zod';
import { useEffect } from 'react';
import CreditDisplay from '../../components/CreditDisplay';
import { Application } from '@klave/db';
import { useToggle } from 'usehooks-ts';

const ApplicationDeletion = () => {

    const navigate = useNavigate();
    const { appSlug, orgSlug } = useParams();
    const [nameCopy, setNameCopy] = useState('');
    const [canSubmit, setCanSubmit] = useState(false);
    const { data: application } = api.v0.applications.getBySlug.useQuery({ appSlug: appSlug || '', orgSlug: orgSlug || '' });
    const utils = api.useUtils().v0.applications;
    const mutation = api.v0.applications.delete.useMutation({
        onSuccess: async () => {
            await utils.getAll.invalidate();
            await utils.getById.invalidate();
            await utils.getBySlug.invalidate();
            await utils.getByOrganisation.invalidate();
            navigate(`/${orgSlug}`);
        }
    });

    useEffect(() => {
        setCanSubmit(nameCopy === appSlug);
    }, [nameCopy, appSlug]);

    const deleteApplication = () => {
        (async () => {
            if (application && appSlug)
                await mutation.mutateAsync({
                    applicationId: application.id
                });
        })()
            .catch(() => { return; });
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
                            This action cannot be undone. This will permanently delete this application and all attached data.
                        </p>
                        <p className='my-2'>
                            If you are really sure you want to delete this application, please type the application name below.
                        </p>
                        <p className='my-2'>
                            <code className='font-bold'>{appSlug}</code>
                        </p>
                        <input placeholder='Application Name' className='w-full' onChange={e => setNameCopy(e.target.value)} />
                    </div>
                </AlertDialog.Description>
                <div className='flex gap-6 justify-end mt-5'>
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

type LimitEditorProps = {
    kredits: bigint | number
    application: Partial<Application>
}

const LimitEditor: FC<LimitEditorProps> = ({ kredits, application: { id } }) => {

    const kreditValue = useMemo(() => Number(kredits), [kredits]);
    const [isEditing, toggleEditing] = useToggle(false);
    const [currentValue, setCurrentValue] = useState(kreditValue);
    const { mutateAsync, error, isPending } = api.v0.applications.setLimits.useMutation();
    const appAPIUtils = api.useUtils().v0.applications;

    useEffect(() => {
        setCurrentValue(kreditValue);
    }, [kreditValue]);

    if (!id || kredits === undefined)
        return null;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const sanitized = e.currentTarget.value.replace(/[^0-9.-]/g, '');
        if (!Number.isNaN(parseFloat(sanitized)))
            setCurrentValue(parseFloat(sanitized));
    };

    const setLimits = () => {
        (async () => {
            await mutateAsync({
                applicationId: id,
                limits: {
                    transactionCallSpend: currentValue as any as bigint
                }
            });
            await appAPIUtils.getAll.invalidate();
            await appAPIUtils.getById.invalidate();
            await appAPIUtils.getBySlug.invalidate();
            await appAPIUtils.getByOrganisation.invalidate();
            toggleEditing();
        })()
            .catch(() => { return; });
    };

    if (isEditing)
        return <form className='flex flex-row gap-2' onSubmit={e => e.preventDefault()}>
            <div className='leading-snug pt-1'>
                <input type='text' value={currentValue.toString()} onChange={handleChange} className='inline border p-2 h-6 text-sm' /><br />
                {isPending
                    ? <span className='text-xs text-green-700'>Setting the new limit ... <UilSpinner className='inline-block animate-spin h-4' /></span>
                    : <span className='text-xs text-red-700'>{error?.message?.toString() ?? ''} &nbsp;</span>
                }
            </div>
            <button disabled={isPending} type="submit" className='border bg-primary-500 p-2' onClick={setLimits}>Save</button>
        </form >;

    if (kreditValue === 0)
        return <b><span className='text-klave-light-blue'>Unlimited</span> <UilEdit onClick={() => toggleEditing()} className='inline-block h-3 hover:cursor-pointer' /></b>;

    return <b><CreditDisplay compact={true} kredits={kredits} /> <UilEdit onClick={() => toggleEditing()} className='inline-block h-3 hover:cursor-pointer' /></b>;
};

export const AppSettings: FC = () => {

    const { appSlug, orgSlug } = useParams();
    const { data: application, isLoading } = api.v0.applications.getBySlug.useQuery({ appSlug: appSlug || '', orgSlug: orgSlug || '' });
    const utils = api.useUtils().v0.applications;
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
            onSubmit={() => {
                methods.handleSubmit(async (data) => {
                    await mutation.mutateAsync({ appId: application.id || '', data });
                    methods.reset();
                })()
                    .catch(() => { return; });
            }}
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
                disabled={mutation.isPending}
                className="border bg-primary-500 p-2"
            >
                {mutation.isPending ? 'Loading' : 'Submit'}
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
            <h1 className='font-bold text-xl mb-5'>Limits</h1>
            <p>
                {/* Query spending limit: <b>{application.limits.queryCallSpend.toString()}</b><br /> */}
                Transaction spending limit: <LimitEditor kredits={application.limits.transactionCallSpend} application={application} /><br />
            </p>
        </div>
        <div>
            <h1 className='font-bold text-xl mb-5'>Credit allocation</h1>
            <p>
                Balance: <b><CreditDisplay kredits={application.kredits} /></b><br />
                <Link to={`/organisation/${orgSlug}/credits`} className='text-klave-light-blue hover:underline'>Manage credit allocations</Link>
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
                        <p className='font-bold'>{grant.user.slug.replace('~$~', '')}</p>
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