import { FC, useState, forwardRef, PropsWithChildren, MouseEvent as ReactMouseEvent } from 'react';
import { useParams } from 'react-router-dom';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Select from '@radix-ui/react-select';
import { UilUserPlus, UilSpinner, UilTrash } from '@iconscout/react-unicons';
import api from '../../utils/api';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';

const AddMember = () => {

    const { orgSlug } = useParams();
    const [userSlug, setUserSlug] = useState('');
    const [permission, setPermission] = useState('read');
    const [canSubmit, setCanSubmit] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string>();
    const { data: organisation } = api.v0.organisations.getBySlug.useQuery({ orgSlug: orgSlug || '' });
    const utils = api.useUtils().v0.organisations;
    const addMutation = api.v0.organisations.addMember.useMutation({
        onError(error) {
            setError(error?.message);
        },
        onSuccess: async () => {
            await utils.getBySlug.invalidate();
            setIsOpen(false);
        }
    });

    const inviteMember = (event: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => {
        (async () => {
            if (organisation && userSlug.length > 0)
                await addMutation.mutateAsync({
                    orgId: organisation.id,
                    userSlug,
                    read: permission === 'read',
                    write: permission === 'write',
                    admin: permission === 'admin'
                });
        })()
            .catch(() => { return; });
        event.preventDefault();
        return false;
    };

    const setSlug = (slug: string) => {
        setError(undefined);
        setUserSlug(slug);
        setCanSubmit(slug.length > 0);
    };

    const changeRight = (value: string) => {
        setError(undefined);
        setPermission(value);
    };

    const handleOpen = (open: boolean) => {
        setIsOpen(open);
    };

    return <AlertDialog.Root onOpenChange={handleOpen} open={isOpen}>
        <AlertDialog.Trigger asChild>
            <button title='Invite a new member' className="btn btn-sm h-8 inline-flex items-center justify-center text-slate-800 text-md font-normal mt-auto">
                <UilUserPlus className='inline-block h-4 w-4' /> Invite a new member
            </button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
            <AlertDialog.Overlay className="AlertDialogOverlay" />
            <AlertDialog.Content className="AlertDialogContent overflow-auto w-[calc(412px)]">
                <AlertDialog.Title className="AlertDialogTitle mb-4">Invite a new member</AlertDialog.Title>
                <AlertDialog.Description className="AlertDialogDescription" asChild>
                    <div>
                        <p className='my-2'>
                            Enter the username of the member you want to invite.
                        </p>
                        <input placeholder='Username' className='input input-bordered w-full' onChange={e => setSlug(e.target.value)} />
                        <p className='my-2'>
                            Select the access level you want to grant to the member.
                        </p>
                        <Select.Root value={permission} defaultValue={orgSlug} onValueChange={changeRight}>
                            <Select.Trigger className={'select select-bordered select-sm inline-flex justify-between flex-grow w-full items-center text-klave-light-blue bg-white data-[placeholder]:text-klave-light-blue mt-3 mb-5'}>
                                <Select.Value placeholder="Select access level" />
                            </Select.Trigger>
                            <Select.Portal>
                                <Select.Content className="overflow-hidden bg-white shadow-outline shadow rounded-lg w-full z-[1000]">
                                    <Select.ScrollUpButton>
                                        <ChevronUpIcon />
                                    </Select.ScrollUpButton>
                                    <Select.Viewport>
                                        <Select.Group>
                                            <SelectItem value='read' className="px-3 py-2 hover:text-klave-cyan hover:cursor-pointer">Read-only</SelectItem>
                                            <SelectItem value='write' className="px-3 py-2 hover:text-klave-cyan hover:cursor-pointer">Write</SelectItem>
                                            <SelectItem value='admin' className="px-3 py-2 hover:text-klave-cyan hover:cursor-pointer">Admin</SelectItem>
                                        </Select.Group>
                                    </Select.Viewport>
                                    <Select.ScrollDownButton>
                                        <ChevronDownIcon />
                                    </Select.ScrollDownButton>
                                </Select.Content>
                            </Select.Portal>
                        </Select.Root>
                    </div>
                </AlertDialog.Description>
                {error
                    ? <div className='flex gap-6 text-sm bg-red-100 p-3 mt-5'>{error}</div>
                    : null}
                <div className='flex gap-6 justify-end mt-5'>
                    <AlertDialog.Cancel asChild>
                        <button className="btn btn-sm ">{'Cancel'}</button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild disabled={!canSubmit}>
                        <button disabled={!canSubmit} className={`btn btn-sm  ${canSubmit ? 'bg-red-700' : 'bg-slate-300'} text-white`} onClick={(e) => inviteMember(e)}>Invite</button>
                    </AlertDialog.Action>
                </div>
            </AlertDialog.Content>
        </AlertDialog.Portal>
    </AlertDialog.Root>;
};

const SelectItem = forwardRef<HTMLDivElement, PropsWithChildren<{
    value: string;
    disabled?: boolean;
    className?: string;
}>>(({ children, className, ...props }, forwardedRef) => {
    return (
        <Select.Item className={`flex h-9 items-center select-none relative px-5 data-[disabled]:text-slate-300 data-[disabled]:pointer-events-none data-[highlighted]:text-klave-light-blue data-[highlighted]:bg-blue-100 data-[highlighted]:outline-none ${className}`} {...props} ref={forwardedRef}>
            <Select.ItemText>{children}</Select.ItemText>
            <Select.ItemIndicator className="SelectItemIndicator">
                <CheckIcon />
            </Select.ItemIndicator>
        </Select.Item>
    );
});

export const OrganisationMembers: FC = () => {

    const { orgSlug } = useParams();
    const [, setError] = useState<string>();
    const { data: organisation, isLoading } = api.v0.organisations.getBySlug.useQuery({ orgSlug: orgSlug || '' }, {

    });
    const utils = api.useUtils().v0.organisations;

    const removeMutation = api.v0.organisations.removeMember.useMutation({
        onError(error) {
            setError(error?.message);
        },
        onSuccess: async () => {
            await utils.getBySlug.invalidate();
        }
    });

    const removeGrant = (grantId: string) => {
        (async () => {
            if (organisation)
                await removeMutation.mutateAsync({
                    grantId
                });
        })()
            .catch(() => { return; });
    };

    if (isLoading || !organisation)
        return <>
            We are fetching data about your organisation.<br />
            It will only take a moment...<br />
            <br />
            <UilSpinner className='inline-block animate-spin h-5' />
        </>;

    return <div className="flex flex-col w-full justify-start mb-7">
        <h1 className='font-bold text-xl mb-5'>Manage Accesses</h1>
        <div className='mb-6'>
            <AddMember />
        </div>
        <table className='w-full col-span-3'>
            <thead className='bg-slate-100 border-slate-100 border rounded-sm '>
                <tr>
                    <th className='text-left p-3'>
                        Name
                    </th>
                    <th className='text-left p-3'>
                        Permission
                    </th>
                    <th className='text-right p-3'>
                        Action
                    </th>
                </tr>
            </thead>
            <tbody>
                {organisation.permissionGrants?.map((grant, i) =>
                    <tr key={i} className='gap-3 border-slate-100 border border-t-0 rounded-sm p-2'>
                        <td className='text-left p-3'>
                            <p className='font-bold'>{grant.user.slug.replace('~$~', '')}</p>
                            <p>{grant.userId ?? grant.organisationId}</p>
                        </td>
                        <td className='text-left p-3'>
                            <p className='font-bold'>{organisation.personal ? 'Owner' : grant.admin ? 'Admin' : grant.write ? 'Write' : grant.read ? 'Read' : 'None'}</p>
                        </td>
                        <td className='text-right p-3'>
                            <button title='Delete' className="btn btn-sm h-8 inline-flex items-center justify-center text-md font-normal text-red-700 mt-auto" onClick={() => removeGrant(grant.id)}>
                                <UilTrash className='inline-block h-4 w-4' /> Delete
                            </button>
                        </td>
                    </tr>

                )}
            </tbody>
        </table>
    </div>;
};

export default OrganisationMembers;