import { FC, useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { UilSpinner } from '@iconscout/react-unicons';
import qs from 'query-string';
import api from '../../utils/api';
import { AlertCircle } from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '@klave/ui-kit/components/ui/card';
import { Button } from '@klave/ui-kit/components/ui/button';
import {
    Alert,
    AlertDescription,
    AlertTitle
} from '@klave/ui-kit/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from '@klave/ui-kit/components/ui/select';

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
        return (
            <div className="flex flex-col gap-6 text-center">
                <h1 className='text-xl font-bold'>{isLoading ? 'Getting to know your repo' : 'We could not find your repo'}</h1>
                {isLoading ? <>
                    <p>
                        We are fetching data about your repository.<br />
                        It will only take a moment...<br />
                    </p>
                    <UilSpinner className='inline-block animate-spin h-5' />
                </> : <>
                    <p>
                        We looked hard but could not find this repo.<br />
                        Head over to the deployment section to find one.<br />
                    </p>
                    <Button className="w-auto self-center" variant="secondary" asChild>
                        <Link to="/deploy">Go to deploy</Link>
                    </Button>
                </>}
            </div>
        );

    const state = JSON.stringify({
        referer: window.location.origin,
        source: 'github',
        redirectUri: `/deploy/repo/${repoInfo.owner}/${repoInfo.name}?postInstall=true`,
        repoFullName: deployableRepo.fullName
    });

    const githubAppInstall = new URL('https://github.com/apps/klave-network/installations/new');
    githubAppInstall.searchParams.append('state', state);

    if (isPostInstall)
        return (
            <div className="flex flex-col gap-6">
                <h1 className='text-xl font-bold text-center'>{isPostInstallStuck ? 'Waiting for your repo' : 'Another moment'}</h1>
                {isPostInstallStuck ? <>
                    <Alert className="bg-yellow-100">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>This is taking longer than usual</AlertTitle>
                        <AlertDescription>
                            Klave still does&apos;t have access to your repository
                        </AlertDescription>
                        <Button className="w-full mt-6" variant="secondary" asChild>
                            <a href={githubAppInstall.toString()} type="submit">
                                Try installing again
                            </a>
                        </Button>
                    </Alert>
                    <div className="flex flex-col gap-6 text-center">
                        <p>
                            We are waiting to hear from GitHub.<br />
                            This shouldn&apos;t be very long...
                        </p>
                        <UilSpinner className='inline-block animate-spin h-5' />
                    </div>
                </> : <div className="flex flex-col gap-6 text-center">
                    <p>
                        We are waiting to hear from GitHub.<br />
                        This shouldn&apos;t be very long...
                    </p>
                    <UilSpinner className='inline-block animate-spin h-5' />
                </div>}
            </div>
        );

    const registerApplications = () => {
        if (!selectedOrgId)
            return;
        mutate({
            applications: selectedApplications,
            deployableRepoId: deployableRepo.id,
            organisationId: selectedOrgId
        });
    };

    return (
        <div className="flex flex-col gap-6 w-[320px]">
            <Card className="">
                <CardHeader className="text-center">
                    <CardTitle className="text-xl font-normal">
                        {deployableRepo.owner} / <b>{deployableRepo.name}</b>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                    <form className={!deployableRepo.isAvailableToKlave ? 'opacity-40' : ''}>
                        <div className="flex flex-col gap-2">
                            <p>
                                We found {deployableRepo.config?.applications?.length ?? 0} applications to deploy.
                                Make your selection and be ready in minutes.
                            </p>
                            {/* <pre className='text-left w-1/2 bg-slate-200 m-auto p-5'>{JSON.stringify(repoData.config ?? repoData.configError, null, 4)}</pre> */}
                            <div className='flex flex-col gap-2'>
                                {(deployableRepo.config?.applications ?? []).map((app, index) => {
                                    return <label key={app.slug} htmlFor={`application-${index}`} className={`w-full ${app.slug && appSelectionWatch.includes(app.slug) ? 'border-sky-400 hover:border-sky-500' : 'border-slate-200 hover:border-slate-400'} duration-200 transition-colors hover:cursor-pointer border rounded-lg py-3 px-4 text-left`}>
                                        <span className='flex flex-row items-center justify-between'>
                                            <input
                                                disabled={!deployableRepo.isAvailableToKlave}
                                                id={`application-${index}`}
                                                type="checkbox"
                                                value={app.slug}
                                                {...register('applications')}
                                                className='peer toggle toggle-sm checked:bg-sky-500 checked:border-sky-500 mr-3'
                                            />
                                            {app.slug}
                                        </span>
                                        {/* <label htmlFor={`application-${index}`}>{app.name}</label> */}
                                    </label>;
                                })}
                            </div>
                        </div>
                        {/* <Link to="/deploy/select" className='mr-5 disabled:text-gray-300 hover:text-gray-500'>Go back</Link>
                        <button disabled={!appSelectionWatch.length || isTriggeringDeploy || hasTriggeredDeploy || !deployableRepo.isAvailableToKlave} type="submit" className='btn btn-sm disabled:text-gray-300 text-white hover:text-blue-500 bg-gray-800'>Next</button> */}
                    </form>
                    <div className="flex flex-col gap-6">
                        {/* There is one more thing.<br /> */}
                        <div className="flex flex-col gap-2">
                            <p>
                                Let us know which organisation you want to create this application in.
                            </p>
                            {areOrganisationsLoading
                                ? <UilSpinner className='inline-block animate-spin h-5' />
                                : <>
                                    <Select value={selectedOrgId} defaultValue={selectedOrgId} onValueChange={setSelectedOrgId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {personals.length > 0
                                                ? <SelectGroup>
                                                    <SelectLabel>Personal Account</SelectLabel>
                                                    {personals.map(o => <SelectItem key={o.id} value={o.id}>{o.slug.replace('~$~', '')}</SelectItem>)}
                                                </SelectGroup>
                                                : null}
                                            {other.length > 0
                                                ? <SelectGroup>
                                                    <SelectLabel>Organisations</SelectLabel>
                                                    {other.map(o => <SelectItem key={o.id} value={o.id}>{o.slug.replace('~$~', '')}</SelectItem>)}
                                                </SelectGroup>
                                                : null}
                                        </SelectContent>
                                    </Select>
                                </>
                            }
                        </div>
                        <div className="flex flex-col gap-2">
                            <p>
                                This will be deployed in the following Location:
                            </p>
                            <Select value='ch' disabled={true}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an account" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='ch'>
                                        Switzerland
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {/* <button type="button" onClick={() => setSelectedApplications([])} className='btn btn-sm mr-5 disabled:text-gray-300 hover:text-gray-500'>Go Back</button> */}
                            <Button asChild variant="outline">
                                <Link
                                    to="/deploy/select"
                                >
                                    Go back
                                </Link>
                            </Button>
                            <Button
                                onClick={registerApplications}
                                disabled={!selectedApplications.length || !selectedOrgId || isTriggeringDeploy || hasTriggeredDeploy || !deployableRepo.isAvailableToKlave || Object.values(canRegisterData ?? {}).includes(false)}
                            >
                                Deploy
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            {/* Alert for unavailable repository */}
            {!deployableRepo.isAvailableToKlave
                ? <Alert className="bg-yellow-100">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Oops!</AlertTitle>
                    <AlertDescription>
                        This repository doesn&apos;t have the Klave Github App installed
                    </AlertDescription>
                    <Button className="w-full mt-6" variant="secondary" asChild>
                        <a href={githubAppInstall.toString()} type="submit">
                            Install it now
                        </a>
                    </Button>
                </Alert>
                : null}
            {/* Alert for klave.json file */}
            {deployableRepo.configError
                ? <Alert className="bg-yellow-100">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Oops!</AlertTitle>
                    <AlertDescription>
                        We noticed some errors in your <code>klave.json</code> file.<br />
                        Checkout our documentation at <a href="https://docs.klave.com" target='_blank'>https://docs.klave.com</a> to fix them.
                    </AlertDescription>
                </Alert>
                : null}
            {/* Error message */}
            {mutationError
                ? <Alert variant="destructive" className="bg-klave-red/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Holy smokes!</AlertTitle>
                    <AlertDescription>
                        {mutationError.message}
                    </AlertDescription>
                </Alert>
                : null}
            {/* Error message - app already exists */}
            {Object.values(canRegisterData ?? {}).includes(false)
                ? <Alert variant="destructive" className="bg-klave-red/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>We cannot register all the applications in the selected organisation.</AlertTitle>
                    <AlertDescription>
                        {Object.entries(canRegisterData ?? {}).filter(([, canRegister]) => !canRegister).map(([name]) => `"${name}"`).join(', ')} already exist in this organisation.<br />
                    </AlertDescription>
                </Alert>
                : null}
        </div>
    );
};

export default RepoAppSelect;
