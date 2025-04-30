import { z } from 'zod';
import { FC, useState } from 'react';
import api from '../../utils/api';
import { useZodForm } from '../../utils/useZodForm';
import { UilSpinner } from '@iconscout/react-unicons';
import { useNavigate } from 'react-router-dom';
import { useDebounceValue } from 'usehooks-ts';

export const OrgNew: FC = () => {

    const navigate = useNavigate();
    const [orgSlug, setOrgSlug] = useState('');
    const sanitizedOrgSlug = orgSlug.replaceAll(/\W/g, '-').toLocaleLowerCase();
    const [debouncedOrgSlug] = useDebounceValue(sanitizedOrgSlug, 500);
    const { data: alreadyExists, isLoading: isOrgLoading } = api.v0.organisations.exists.useQuery({
        orgSlug: debouncedOrgSlug
    });

    const utils = api.useUtils().v0.organisations;
    const mutation = api.v0.organisations.create.useMutation({
        onSuccess: async (data) => {
            await utils.getAll.invalidate();
            await utils.exists.invalidate();
            if (data)
                navigate(`/${data.slug}`);
        }
    });

    const methods = useZodForm({
        schema: z.object({
            slug: z.string()
        }),
        values: {
            slug: orgSlug.replaceAll(/\W/g, '-').trim()
        }
    });

    return <>
        <div className="sm:px-7 sm:pt-7 px-4 pt-4 flex flex-col w-full border-b border-gray-200 bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 sticky top-0">
            <div className="flex w-full items-center">
                <div className="flex items-center text-3xl text-gray-900 dark:text-white">
                    Create your organisation
                </div>
            </div>
            <div className="flex items-center space-x-3 sm:mt-7 mt-4" />
        </div>
        <div className="sm:p-7 p-4 flex-grow">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    methods.handleSubmit(async (data) => {
                        await mutation.mutateAsync({ slug: orgSlug ?? '', data });
                        methods.reset();
                    })()
                        .catch(() => { return; });
                }}
                className="space-y-2"
            >
                <div className='flex flex-col gap-3'>
                    <label>
                        Organization name
                        <br />
                        <input {...methods.register('slug')} onChange={e => setOrgSlug(e.target.value.trim())} className="input input-bordered border w-2/3" /><br />
                        {isOrgLoading
                            ? <span className='block mt-1 text-xs leading-tight overflow-clip'><UilSpinner className='inline-block animate-spin h-5' /><br />&nbsp;</span>
                            : alreadyExists
                                ? <span className="block mt-1 text-xs text-red-700 leading-tight">The organisation <b>{orgSlug}</b> already exists.<br />&nbsp;</span>
                                : orgSlug.length
                                    ? <span className="block mt-1 text-xs text-green-700 leading-tight">This name is available !<br />Your URL on Klave will be https://klave.com/<b>{orgSlug.toLocaleLowerCase()}</b></span>
                                    : <span className="block mt-1 text-xs leading-tight">&nbsp;<br />&nbsp;</span>}
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
                    className="btn btn-sm border bg-blue-600 text-white hover:bg-blue-500 mr-2 p-2"
                >
                    {mutation.isPending ? 'Creating' : 'Create'}
                </button>
                <button
                    className="btn btn-sm border p-2"
                    onClick={() => navigate('/')}
                >
                    Cancel
                </button>
            </form>
        </div>
    </>;
};

export default OrgNew;