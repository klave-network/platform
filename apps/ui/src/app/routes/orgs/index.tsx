import { FC } from 'react';
import { NavLink, useOutlet, useParams } from 'react-router-dom';
import { UilSpinner } from '@iconscout/react-unicons';
import api from '../../utils/api';
import { formatTimeAgo } from '../../utils/formatTimeAgo';

export const OrgListing: FC = () => {

    const outlet = useOutlet();
    const { orgSlug } = useParams();
    const { data: organisationList, isLoading: isOrgLoading } = api.v0.organisations.getAll.useQuery();
    const organisation = organisationList?.filter(o => o.slug === orgSlug)[0];

    if (!orgSlug)
        return <>
            <div className="sm:px-7 sm:pt-7 px-4 pt-4 flex flex-col w-full border-b border-gray-200 bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 sticky top-0">
                <div className="flex w-full items-center">
                    <div className="flex items-center text-3xl text-gray-900 dark:text-white">
                        Organisations
                    </div>
                </div>
                <div className="flex items-center space-x-3 sm:mt-7 mt-4" />
            </div>
            <div className="sm:p-7 p-4">
                Select an organisation to browse the info
            </div>
        </>;

    if (isOrgLoading)
        return <>
            <div className="sm:px-7 sm:pt-7 px-4 pt-4 flex flex-col w-full border-b border-gray-200 bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 sticky top-0">
                <div className="flex w-full items-center">
                    <div className="flex items-center text-3xl text-gray-900 dark:text-white">
                        Looking for your organisation <UilSpinner className='inline-block animate-spin' />
                    </div>
                </div>
                <div className="flex items-center space-x-3 sm:mt-7 mt-4" />
            </div>
            <div className="sm:p-7 p-4">
                We are fetching data about your organisations.<br />
                It will only take a moment...<br />
            </div>
        </>;

    if (!organisation)
        return <>
            <div className="sm:px-7 sm:pt-7 px-4 pt-4 flex flex-col w-full border-b border-gray-200 bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 sticky top-0">
                <div className="flex w-full items-center">
                    <div className="flex items-center text-3xl text-gray-900 dark:text-white">
                        Something went wrong
                    </div>
                </div>
                <div className="flex items-center space-x-3 sm:mt-7 mt-4" />
            </div>
            <div className="sm:p-7 p-4">
                We could not find an information about your organisations.<br />
                Please try again in a little while.<br />
            </div>
        </>;

    return <>
        <div className="sm:px-7 sm:pt-7 px-4 pt-4 flex flex-col w-full border-b border-gray-200 bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 sticky top-0">
            <div className="flex w-full items-center">
                <div className="font-medium flex items-center text-3xl text-gray-900 dark:text-white">
                    {organisation.slug.replace('~$~', '')}
                </div>
                <div className="ml-auto sm:flex hidden items-center justify-end">
                    <div className="text-right">
                        <div className="text-xs text-gray-400 dark:text-gray-400">Created</div>
                        <div className="text-gray-900 text-lg dark:text-white font-medium" title={organisation.createdAt.toDateString()}>{formatTimeAgo(organisation.createdAt)}</div>
                    </div>
                    {/*
                    <button className="btn btn-sm w-8 h-8 ml-4 text-gray-400 shadow dark:text-gray-400 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700">
                        <svg viewBox="0 0 24 24" className="w-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                        </svg>
                    </button>
                     */}
                </div>
            </div>
            <div className="flex items-center space-x-3 sm:mt-7 mt-4">
                <NavLink to={`/organisation/${orgSlug}`} end={true} className={({ isActive }) => `px-3 pb-1.5 border-b-2 ${isActive ? 'border-klave-light-blue text-klave-light-blue dark:text-white dark:border-white font-bold' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-klave-light-blue'}`}>
                    Activities
                </NavLink>
                <NavLink to={`/organisation/${orgSlug}/credits`} className={({ isActive }) => `px-3 pb-1.5 border-b-2 ${isActive ? 'border-klave-light-blue text-klave-light-blue dark:text-white dark:border-white font-bold' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-klave-light-blue'}`}>
                    Credits
                </NavLink>
                <NavLink to={`/organisation/${orgSlug}/settings`} className={({ isActive }) => `px-3 pb-1.5 border-b-2 ${isActive ? 'border-klave-light-blue text-klave-light-blue dark:text-white dark:border-white font-bold' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-klave-light-blue'}`}>
                    Settings
                </NavLink>
            </div>
        </div>
        <div className="sm:p-7 p-4">
            {outlet}
        </div>
    </>;
};

export default OrgListing;