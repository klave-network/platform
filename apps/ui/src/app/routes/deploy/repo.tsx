import { FC, useState, useEffect, useMemo, forwardRef, PropsWithChildren } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { UilSpinner, UilExclamationTriangle } from '@iconscout/react-unicons';
import * as Select from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import qs from 'query-string';
import api from '../../utils/api';

export const RepoAppSelect: FC = () => {

    const navigate = useNavigate();
    const repoInfo = useParams() as { owner: string, name: string };
    const { data: deployableRepo, isLoading } = api.v0.repos.getDeployableRepo.useQuery(repoInfo, {
        refetchInterval: (data) => {
            if (data.state.data?.isAvailableToKlave)
                return false;
            return 1000;
        }
    });

    const { data: organisations, isLoading: areOrganisationsLoading } = api.v0.organisations.getAllWithWrite.useQuery();
    const personals = useMemo(() => organisations?.filter(Boolean).filter(o => o.personal) ?? [], [organisations]);
    const other = useMemo(() => organisations?.filter(Boolean).filter(o => o.personal === false) ?? [], [organisations]);

    const { mutate, isPending: isTriggeringDeploy, isSuccess: hasTriggeredDeploy, error: mutationError } = api.v0.applications.register.useMutation({
        onSuccess: () => {
            const org = organisations?.find(o => o.id === selectedOrgId);
            if (!org)
                return;
            const [slug] = selectedApplications;
            navigate(`/${org.slug}/${slug}`);
        }
    });

    const { register, watch } = useForm<{ applications: string[] }>();
    const { postInstall } = qs.parse(window.location.search);
    const [isPostInstall, setIsPostInstall] = useState<boolean>(postInstall === 'true');
    const [isPostInstallStuck, setIsPostInstallStuck] = useState(false);
    const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState('00000000-0000-0000-0000-000000000000');

    let appSelectionWatch = watch('applications');
    appSelectionWatch = (Array.isArray(appSelectionWatch) ? appSelectionWatch : [appSelectionWatch]).filter(Boolean);

    const { data: canRegisterData, isLoading: isCanRegisterLoading, refetch: refetchCanRegister } = api.v0.applications.canRegister.useQuery({
        applications: appSelectionWatch,
        organisationId: selectedOrgId
    }, {
        // refetchInterval: 100000,
        retry: false,
        enabled: false
    });

    useEffect(() => {
        const refUUID = personals[0]?.id ?? organisations?.[0]?.id;
        if (refUUID && refUUID.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/))
            setSelectedOrgId(refUUID);
    }, [personals[0]?.id, organisations?.[0]?.id]);

    useEffect(() => {
        if (isCanRegisterLoading)
            return;
        refetchCanRegister()
            .catch(() => { return; });
    }, [selectedOrgId, canRegisterData, refetchCanRegister]);

    useEffect(() => {
        if (deployableRepo?.isAvailableToKlave) {
            navigate(window.location.pathname);
            setIsPostInstall(false);
        } else if (postInstall === 'true') {
            setIsPostInstall(true);
        } else {
            setIsPostInstall(false);
        }
    }, [deployableRepo?.isAvailableToKlave, navigate, postInstall]);

    useEffect(() => {
        let updateReceptionTimer: NodeJS.Timeout | undefined;
        if (!deployableRepo?.isAvailableToKlave) {
            updateReceptionTimer = setTimeout(() => {
                setIsPostInstallStuck(true);
            }, 10000);
        }
        return () => {
            if (updateReceptionTimer)
                clearTimeout(updateReceptionTimer);
        };
    }, []);

    useEffect(() => {
        setSelectedApplications(appSelectionWatch);
    }, [appSelectionWatch.length]);

    if (isLoading || !deployableRepo)
        return <>
            <div className='pb-5' >
                <h1 className='text-xl font-bold'>{isLoading ? 'Getting to know your repo' : 'We could not find your repo'}</h1>
            </div>
            <div className='relative'>
                {isLoading ? <>
                    We are fetching data about your repository.<br />
                    It will only take a moment...<br />
                    <br />
                    <UilSpinner className='inline-block animate-spin' />
                </> : <>
                    We looked hard but could not find this repo.<br />
                    Head over to the deployment section to find one.<br />
                    <br />
                    <Link to="/deploy" className='btn btn-sm disabled:text-gray-300'>Go to deploy</Link>
                </>}
            </div>
        </>;

    const state = JSON.stringify({
        referer: window.location.origin,
        source: 'github',
        redirectUri: `/deploy/repo/${repoInfo.owner}/${repoInfo.name}?postInstall=true`,
        repoFullName: deployableRepo.fullName
    });

    const githubAppInstall = new URL('https://github.com/apps/klave-network/installations/new');
    githubAppInstall.searchParams.append('state', state);

    if (isPostInstall)
        return <>
            <div className='pb-5' >
                <h1 className='text-xl font-bold'>{isPostInstallStuck ? 'Waiting for your repo' : 'Another moment'}</h1>
            </div>
            <div className='relative'>
                {isPostInstallStuck ? <>
                    <div className='bg-yellow-200 p-5 mb-10 w-full text-center text-yellow-800'>
                        <UilExclamationTriangle className='inline-block mb-3' /><br />
                        <span>This is taking longer than usual</span><br />
                        <span>Klave still does&apos;t have access to your repository</span><br />
                        <br />
                        <a href={githubAppInstall.toString()} type="submit" className='btn btn-sm mt-5 bg-yellow-800 text-white'>Try installing again</a>
                    </div>
                    We are waiting to hear from GitHub.<br />
                    This shouldn&apos;t be very long...<br />
                    <UilSpinner className='inline-block animate-spin' />
                </> : <>
                    We are waiting to hear from GitHub.<br />
                    This shouldn&apos;t be very long...<br />
                    <br />
                    <UilSpinner className='inline-block animate-spin' />
                </>}
            </div>
        </>;

    const registerApplications = () => {
        if (!selectedOrgId)
            return;
        mutate({
            applications: selectedApplications,
            deployableRepoId: deployableRepo.id,
            organisationId: selectedOrgId
        });
    };

    return <>
        <div className='pb-5' >
            <h1 className='text-xl'>{deployableRepo.owner} / <b>{deployableRepo.name}</b></h1>
        </div>
        {!deployableRepo.isAvailableToKlave
            ? <div className='bg-yellow-200 p-5 mb-10 w-full text-center text-yellow-800'>
                <UilExclamationTriangle className='inline-block mb-3' /><br />
                <span>This repository doesn&apos;t have the Klave Github App installed</span><br />
                <a href={githubAppInstall.toString()} type="submit" className='btn btn-sm mt-5 bg-yellow-800 text-white'>Install it now !</a>
            </div>
            : null}
        <div className='relative'>
            <form >
                <div className={!deployableRepo.isAvailableToKlave ? 'opacity-40' : ''}>
                    We found {deployableRepo.config?.applications?.length ?? 0} applications to deploy.<br />
                    Make your selection and be ready in minutes<br />
                    <br />
                    {deployableRepo.configError ? <>
                        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mx-auto" role="alert">
                            We noticed some errors in your <code>klave.json</code> file.<br />
                            Checkout our documentation at <a href="https://klave.com/docs" target='_blank' >https://klave.com/docs</a> to fix them.<br />
                        </div>
                        <br />
                    </> : null}
                    {/* <pre className='text-left w-1/2 bg-slate-200 m-auto p-5'>{JSON.stringify(repoData.config ?? repoData.configError, null, 4)}</pre> */}
                    <div className='grid gap-3 grid-cols-3'>
                        {(deployableRepo.config?.applications ?? []).map((app, index) => {
                            return <label key={app.slug} htmlFor={`application-${index}`} className={`w-full ${app.slug && appSelectionWatch.includes(app.slug) ? 'border-sky-400 hover:border-sky-500' : 'border-slate-200 hover:border-slate-400'} hover:cursor-pointer border rounded-lg py-3 px-4 text-left`}>
                                <span className='flex flex-row items-center'>
                                    <input disabled={!deployableRepo.isAvailableToKlave} id={`application-${index}`} type="checkbox" value={app.slug} {...register('applications')} className='peer toggle toggle-sm checked:bg-sky-500 checked:border-sky-500 mr-3' />
                                    {app.slug}</span>
                                {/* <label htmlFor={`application-${index}`}>{app.name}</label> */}
                            </label>;
                        })}
                    </div>
                    <br />
                    <br />
                    {mutationError ? <>
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative w-1/2 mx-auto" role="alert">
                            <strong className="font-bold">Holy smokes!</strong>
                            <span className="block sm:inline"> {mutationError.message}</span>
                        </div>
                        <br />
                    </> : null}
                </div>
                {/* <Link to="/deploy/select" className='mr-5 disabled:text-gray-300 hover:text-gray-500'>Go back</Link>
                <button disabled={!appSelectionWatch.length || isTriggeringDeploy || hasTriggeredDeploy || !deployableRepo.isAvailableToKlave} type="submit" className='btn btn-sm disabled:text-gray-300 text-white hover:text-blue-500 bg-gray-800'>Next</button> */}
            </form >
        </div >
        <div className='relative'>
            {/* There is one more thing.<br /> */}
            Let us know which organisation you want to create this application in.<br />
            {areOrganisationsLoading
                ? <UilSpinner className='inline-block animate-spin' />
                : <>
                    <Select.Root value={selectedOrgId} defaultValue={selectedOrgId} onValueChange={setSelectedOrgId}>
                        <Select.Trigger className={'select select-bordered inline-flex justify-between flex-grow w-full items-center text-klave-light-blue bg-white data-[placeholder]:text-klave-light-blue mt-3 mb-5'}>
                            <Select.Value placeholder="Select an account" />
                        </Select.Trigger>
                        <Select.Portal>
                            <Select.Content className="border overflow-hidden bg-white shadow-outline rounded-lg w-full z-[1000]">
                                <Select.ScrollUpButton>
                                    <ChevronUpIcon />
                                </Select.ScrollUpButton>
                                <Select.Viewport>
                                    {personals.length > 0
                                        ? <Select.Group>
                                            <Select.Label className="text-xs text-slate-400 px-3 py-1">Personal Account</Select.Label>
                                            {personals.map(o => <SelectItem key={o.id} value={o.id} className="px-3 py-2 hover:text-klave-cyan hover:cursor-pointer">{o.slug.replace('~$~', '')}</SelectItem>)}
                                        </Select.Group>
                                        : null}
                                    {other.length > 0
                                        ? <>
                                            <Select.Separator className="text-xs text-slate-400 p-1" />
                                            <Select.Group>
                                                <Select.Label className="text-xs text-slate-400 px-3 py-1">Organisations</Select.Label>
                                                {other.map(o => <SelectItem key={o.id} value={o.id} className='px-3 py-2 hover:text-klave-cyan hover:cursor-pointer overflow-hidden'>{o.slug.replace('~$~', '')}</SelectItem>)}
                                            </Select.Group>
                                        </> : null}
                                </Select.Viewport>
                                <Select.ScrollDownButton>
                                    <ChevronDownIcon />
                                </Select.ScrollDownButton>
                            </Select.Content>
                        </Select.Portal>
                    </Select.Root>
                </>
            }
            <br />
            This will be deployed in the following Location:<br />
            <Select.Root value='ch' disabled={true}>
                <Select.Trigger className={'select select-bordered inline-flex justify-between flex-grow w-full items-center text-gray-400 bg-white data-[placeholder]:text-gray-400 mt-3 mb-5'}>
                    <Select.Value placeholder="Select an account" />
                </Select.Trigger>
                <Select.Portal>
                    <Select.Content className="border overflow-hidden bg-white shadow-outline rounded-lg w-full z-[1000]">
                        <Select.ScrollUpButton>
                            <ChevronUpIcon />
                        </Select.ScrollUpButton>
                        <Select.Viewport>
                            <SelectItem value='ch' className="px-3 py-2 text-gray-400 hover:cursor-pointer">Switzerland</SelectItem>
                        </Select.Viewport>
                        <Select.ScrollDownButton>
                            <ChevronDownIcon />
                        </Select.ScrollDownButton>
                    </Select.Content>
                </Select.Portal>
            </Select.Root>
            <br />
            <br />
            {Object.values(canRegisterData ?? {}).includes(false) ? <>
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-auto" role="alert">
                    We cannot register all the applications in the selected organisation.<br />
                    {Object.entries(canRegisterData ?? {}).filter(([, canRegister]) => !canRegister).map(([name]) => `"${name}"`).join(', ')} already exist in this organisation.<br />
                </div>
                <br />
            </> : null}
            {/* <button type="button" onClick={() => setSelectedApplications([])} className='btn btn-sm mr-5 disabled:text-gray-300 hover:text-gray-500'>Go Back</button> */}
            <Link to="/deploy/select" className='mr-5 disabled:text-gray-300 hover:text-gray-500'>Go back</Link>
            <button onClick={registerApplications} disabled={!selectedApplications.length || !selectedOrgId || isTriggeringDeploy || hasTriggeredDeploy || !deployableRepo.isAvailableToKlave || Object.values(canRegisterData ?? {}).includes(false)} className='btn btn-sm disabled:text-gray-300 text-white hover:text-blue-500 bg-gray-800'>Deploy</button>
        </div>
    </>;


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

export default RepoAppSelect;