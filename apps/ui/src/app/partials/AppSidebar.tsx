import { FC, useEffect, useMemo } from 'react';
import { Link, NavLink, useMatches, useNavigate, useParams } from 'react-router-dom';
import { UilFlask, UilSpinner, UilSetting, UilCoins, UilBookOpen } from '@iconscout/react-unicons';
import api from '../utils/api';
import AccountSelector from '../components/AccountSelector';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from '@klave/ui-kit/components/ui/sidebar';

export const AppSidebar: FC = () => {

    const navigate = useNavigate();
    const { orgSlug } = useParams();
    const matches = useMatches();
    const lastMatch = matches[matches.length - 1];
    const { data: personalOrg, isLoading: isPeronsalOrgLoading } = api.v0.organisations.getPersonal.useQuery();
    const { data: selectedOrg, isLoading: isLoadingSelectOrg } = api.v0.organisations.getBySlug.useQuery({
        orgSlug: orgSlug ?? ''
    });
    const { data: applicationsList, isLoading: isAppsLoading } = api.v0.applications.getByOrganisation.useQuery({
        orgSlug: orgSlug ?? ''
    }, {
        refetchInterval: (s) => s.state.data?.find(a => a.deployments.find(d => !['errored', 'terminated', 'deployed'].includes(d.status ?? ''))) === undefined ? 60000 : 500
    });

    const isCreatingNewOrg = useMemo(() => lastMatch?.pathname === '/organisation/new' || orgSlug === 'new', [lastMatch, orgSlug]);

    useEffect(() => {
        if (isCreatingNewOrg)
            return;
        if (!orgSlug && personalOrg)
            navigate(`/${personalOrg.slug}`);
    }, [navigate, isCreatingNewOrg, orgSlug, personalOrg]);

    useEffect(() => {
        if (isCreatingNewOrg)
            return;
        if (orgSlug && personalOrg && !selectedOrg && !isLoadingSelectOrg)
            navigate(`/${personalOrg.slug}`);
    }, [navigate, isCreatingNewOrg, orgSlug, personalOrg, selectedOrg, isLoadingSelectOrg]);

    const sortedApplications = useMemo(() => (applicationsList ?? []).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), [applicationsList]);

    if (isCreatingNewOrg)
        return null;

    if (!orgSlug && personalOrg)
        return null;

    if (isPeronsalOrgLoading)
        return <Sidebar className="">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        ORGANISATIONS <UilSpinner className='animate-spin h-5' />
                    </SidebarGroupLabel>
                    <AccountSelector />
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>;

    if (isAppsLoading || !applicationsList || !lastMatch)
        return <Sidebar className="">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        ORGANISATIONS
                    </SidebarGroupLabel>
                    <AccountSelector />
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        APPLICATIONS <UilSpinner className='animate-spin h-5' />
                    </SidebarGroupLabel>
                    <AccountSelector />
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>;

    return (
        <Sidebar className="">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>ORGANISATIONS</SidebarGroupLabel>
                    <AccountSelector />
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link to={`/organisation/${orgSlug}`}>
                                        <UilBookOpen className='h-5' />
                                        <span>Organisation Activity</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link to={`/organisation/${orgSlug}/credits`}>
                                        <UilCoins className='h-5' />
                                        <span>Organisation Credits</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link to={`/organisation/${orgSlug}/settings`}>
                                        <UilSetting className='h-5' />
                                        <span>Organisation Settings</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>APPLICATIONS</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-4">
                            {sortedApplications.map((app, index) => {
                                const deployedCount = app.deployments?.filter(d => d.status === 'deployed').length ?? 0;
                                const terminatedCount = app.deployments?.filter(d => d.status === 'terminated').length ?? 0;
                                const erroredCount = app.deployments?.filter(d => d.status === 'errored').length ?? 0;
                                const destPath = lastMatch.params['appSlug'] ? lastMatch.pathname.split('/').filter(Boolean).slice(0, 3).join('/').replace(lastMatch.params['appSlug'], app.slug) : `/${orgSlug}/${app.slug}`;
                                return <SidebarMenuItem>
                                    <NavLink
                                        to={destPath}
                                        key={index}
                                        className={({ isActive }) => `${isActive ? 'ring-2 ring-klave-light-blue focus:outline-none' : 'hover:bg-card hover:border-klave-light-blue'} duration-200 transition-colors bg-background p-3 w-full flex flex-col rounded-md border border-border`}
                                    >
                                        <div className="flex flex-row items-start font-medium pb-2 mb-2 xl:border-b border-border w-full">
                                            {app.slug}&nbsp;{(app.deployments?.filter(d => d.status === 'created' || d.status === 'deploying').length ?? 0) ? <UilFlask className="inline-block animate-pulse h-5 text-blue-500" /> : <>&nbsp;</>}
                                        </div>
                                        <div className="flex flex-col items-start justify-start flex-grow-0 gap-2 w-full">
                                            {deployedCount ? <div className="text-xs py-1 px-2 leading-none dark:bg-gray-900 bg-green-100 text-green-600 rounded-md">{deployedCount} active deployments</div> : null}
                                            {terminatedCount ? <div className="text-xs py-1 px-2 leading-none dark:bg-gray-900 bg-yellow-100 dark:text-yellow-400 text-yellow-600 rounded-md">{terminatedCount} terminated deployments</div> : null}
                                            {erroredCount ? <div className="text-xs py-1 px-2 leading-none dark:bg-gray-900 bg-red-100 text-red-600 rounded-md">{erroredCount} errors</div> : null}
                                        </div>
                                    </NavLink>
                                </SidebarMenuItem>;
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
};
