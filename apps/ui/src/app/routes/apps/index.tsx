import { FC, useEffect, useState } from 'react';
import { NavLink, useOutlet, useParams } from 'react-router-dom';
import { UilSpinner } from '@iconscout/react-unicons';
import api from '../../utils/api';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import RustLogo from '../../images/source_types/rust.svg';
import ASLogo from '../../images/source_types/assemblyscript.svg';
import WASMLogo from '../../images/source_types/wasm.svg';

export const AppTabs: FC = () => {

    const outlet = useOutlet();
    const { appSlug, orgSlug } = useParams();
    const [sourceType, setSourceType] = useState('unknown');
    const { data: application, isLoading } = api.v0.applications.getBySlug.useQuery({ appSlug: appSlug ?? '', orgSlug: orgSlug ?? '' });
    const { data: deploymentList } = api.v0.deployments.getByApplication.useQuery({ appId: application?.id ?? '' });

    useEffect(() => {
        setSourceType('unknown');
    }, [application?.id]);

    useEffect(() => {
        const newSourceType = deploymentList?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).shift()?.sourceType;
        if (newSourceType !== undefined)
            setSourceType(newSourceType ?? 'unknown');
    }, [deploymentList]);

    if (!appSlug)
        return <>
            <div className="sm:px-7 sm:pt-7 px-4 pt-4 flex flex-col w-full border-b border-gray-200 bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 sticky top-0">
                <div className="flex w-full items-center">
                    <div className="flex items-center text-3xl text-gray-900 dark:text-white">
                        Applications
                    </div>
                </div>
                <div className="flex items-center space-x-3 sm:mt-7 mt-4" />
            </div>
            <div className="sm:p-7 p-4 flex-grow">
                Select an application to browse the info
            </div>
        </>;

    if (isLoading || !application)
        return <>
            <div className="sm:px-7 sm:pt-7 px-4 pt-4 flex flex-col w-full border-b border-gray-200 bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 sticky top-0">
                <div className="flex w-full items-center">
                    <div className="flex items-center text-3xl text-gray-900 dark:text-white">
                        Looking for your apps <UilSpinner className='inline-block animate-spin h-5' />
                    </div>
                </div>
                <div className="flex items-center space-x-3 sm:mt-7 mt-4" />
            </div>
            <div className="sm:p-7 p-4 flex-grow">
                We are fetching data about your applications.<br />
                It will only take a moment...<br />
            </div>
        </>;

    return <>
        <div className="sm:px-7 sm:pt-7 px-4 pt-4 flex flex-col w-full border-b border-gray-200 bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 sticky top-0">
            <div className="flex w-full items-center">
                <div className="font-medium flex items-center text-3xl text-gray-900 dark:text-white">
                    {orgSlug} / {application.slug} <img alt='Language logo' className='h-5 mt-2 ml-3' src={sourceType?.includes('rust') ? RustLogo : sourceType === 'assemblyscript' ? ASLogo : sourceType === 'wasm' ? WASMLogo : 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'/%3E'} />
                </div>
                <div className="ml-auto sm:flex hidden items-center justify-end">
                    <div className="text-right">
                        <div className="text-xs text-gray-400 dark:text-gray-400">Created</div>
                        <div className="text-gray-900 text-lg dark:text-white font-medium" title={application.createdAt.toDateString()}>{formatTimeAgo(application.createdAt)}</div>
                    </div>
                    {/*
                    <button className="btn btn-md h-8 w-8 h-8 ml-4 text-gray-400 shadow-sm dark:text-gray-400 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700">
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
                <NavLink to={`/${orgSlug}/${appSlug}`} end={true} className={({ isActive }) => `px-3 pb-1.5 border-b-2 ${isActive ? 'border-klave-light-blue text-klave-light-blue dark:text-white dark:border-white font-bold' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-klave-light-blue'}`}>
                    Activities
                </NavLink>
                <NavLink to={'deployments'} className={({ isActive }) => `px-3 pb-1.5 border-b-2 ${isActive ? 'border-klave-light-blue text-klave-light-blue dark:text-white dark:border-white font-bold' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-klave-light-blue'}`}>
                    Deployments
                </NavLink>
                <NavLink to={'domains'} className={({ isActive }) => `px-3 pb-1.5 border-b-2 ${isActive ? 'border-klave-light-blue text-klave-light-blue dark:text-white dark:border-white font-bold' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-klave-light-blue'}`}>
                    Domains
                </NavLink>
                <NavLink to={'usage'} className={({ isActive }) => `px-3 pb-1.5 border-b-2 ${isActive ? 'border-klave-light-blue text-klave-light-blue dark:text-white dark:border-white font-bold' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-klave-light-blue'}`}>
                    Usage
                </NavLink>
                <NavLink to={'settings'} className={({ isActive }) => `px-3 pb-1.5 border-b-2 ${isActive ? 'border-klave-light-blue text-klave-light-blue dark:text-white dark:border-white font-bold' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-klave-light-blue'}`}>
                    Settings
                </NavLink>
            </div>
        </div>
        <div className="sm:p-7 p-4 flex-grow">
            {outlet}
        </div>
    </>;
};

export default AppTabs;