import { FC, useMemo } from 'react';
import { Link, NavLink, useMatches, useNavigate, useParams } from 'react-router-dom';
import { UilFlask, UilSpinner, UilSetting } from '@iconscout/react-unicons';
import api from '../../utils/api';
import AccountSelector from '../../components/AccountSelector';

export const AppSidebar: FC = () => {

    const navigate = useNavigate();
    const { orgSlug } = useParams();
    const matches = useMatches();
    const lastMatch = matches[matches.length - 1];
    const { data: personalOrg, isLoading: isPeronsalOrgLoading } = api.v0.organisations.getPersonal.useQuery();
    const { data: applicationsList, isLoading: isAppsLoading } = api.v0.applications.getByOrganisation.useQuery({
        orgSlug: orgSlug ?? ''
    }, {
        refetchInterval: 5000
    });

    const sortedApplications = useMemo(() => (applicationsList ?? []).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), [applicationsList])

    if (lastMatch?.pathname === '/organisation/new' || orgSlug === 'new')
        return null;

    if (!orgSlug && personalOrg) {
        navigate(`/${personalOrg.slug}`)
        return null;
    }

    if (isPeronsalOrgLoading)
        return <>
            <div className="text-xs text-gray-400 tracking-wider">ORGANISATIONS <UilSpinner className='inline-block animate-spin' /></div>
            <AccountSelector />
        </>;

    if (isAppsLoading || !applicationsList || !lastMatch)
        return <>
            <div className="text-xs text-gray-400 tracking-wider">ORGANISATIONS</div>
            <AccountSelector />
            <div className="text-xs text-gray-400 tracking-wider">APPLICATIONS <UilSpinner className='inline-block animate-spin' /></div>
        </>;

    return <>
        <div className="text-xs text-gray-400 tracking-wider">ORGANISATIONS</div>
        <AccountSelector />
        <Link to={`/organisation/${orgSlug}/settings`}>
            <div className="flex p-2 rounded-md gap-1 text-black items-center justify-start align-middle bg-slate-100 hover:bg-slate-200">
                <UilSetting className='inline-block text-slate-500 h-5' /><span>Organisation Settings</span>
            </div >
        </Link>
        <div className="mt-5 text-xs text-gray-400 tracking-wider">APPLICATIONS ({applicationsList.length ?? 0})</div>
        {/* <div className="relative mt-2">
            <input type="text" className="pl-8 h-9 bg-transparent border border-gray-300 dark:border-gray-700 dark:text-white w-full rounded-md text-sm" placeholder="Search" />
            <svg viewBox="0 0 24 24" className="w-4 absolute text-gray-400 top-1/2 transform translate-x-0.5 -translate-y-1/2 left-2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
        </div> */}
        <div className="space-y-4 mt-3">
            {sortedApplications.map((app, index) => {
                const deployedCount = app.deployments?.filter(d => d.status === 'deployed').length ?? 0;
                const erroredCount = app.deployments?.filter(d => d.status === 'errored').length ?? 0;
                const destPath = lastMatch.params['appSlug'] ? lastMatch.pathname.split('/').filter(Boolean).slice(0, 3).join('/').replace(lastMatch.params['appSlug'], app.slug) : `/${orgSlug}/${app.slug}`;
                return <NavLink to={destPath} key={index} className={({ isActive }) => `${isActive ? 'shadow-lg relative ring-2 ring-klave-light-blue hover:ring-klave-cyan focus:outline-none' : ''} bg-white p-3 w-full flex flex-col rounded-md dark:bg-gray-800 shadow hover:bg-gray-100 dark:hover:bg-gray-700`}>
                    <div className="flex flex-row items-start font-medium text-gray-900 dark:text-white pb-2 mb-2 xl:border-b border-gray-200 border-opacity-75 dark:border-gray-700 w-full">
                        {app.name}&nbsp;{(app.deployments?.filter(d => d.status === 'created' || d.status === 'deploying').length ?? 0) ? <UilFlask className="inline-block animate-pulse h-5 text-blue-500" /> : <>&nbsp;</>}
                    </div>
                    <div className="flex flex-col items-start justify-start flex-grow-0 gap-2 w-full">
                        {deployedCount ? <div className="text-xs py-1 px-2 leading-none dark:bg-gray-900 bg-green-100 text-green-600 rounded-md">{deployedCount} active deployments</div> : null}
                        {erroredCount ? <div className="text-xs py-1 px-2 leading-none dark:bg-gray-900 bg-red-100 text-red-600 rounded-md">{erroredCount} errors</div> : null}
                    </div>
                </NavLink>;
            })}
        </div>
    </>;
};

export default AppSidebar;