import { FC } from 'react';
import { useOutlet } from 'react-router-dom';
import AppListing from '../apps/list';

export const Dashboard: FC = () => {

    const outlet = useOutlet();

    return <div className="bg-gray-100 dark:bg-gray-900 dark:text-white text-gray-600 flex-grow flex overflow-hidden text-sm border-t dark:border-gray-800">
        {/*
        <div className="bg-white dark:bg-gray-900 dark:border-gray-800 w-20 flex-shrink-0 border-r border-gray-200 flex-col hidden sm:flex">
            <div className="flex mx-auto flex-grow mt-4 flex-col text-gray-400 space-y-4">
                <button className="h-10 w-12 dark:bg-gray-700 dark:text-white rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                    <svg viewBox="0 0 24 24" className="h-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                </button>
            </div>
        </div>
         */}
        <div className="flex-grow overflow-hidden h-full flex flex-col">
            <div className="flex-grow flex overflow-x-hidden">
                <div className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 h-full min-h-[50vh] overflow-y-auto sm:block hidden p-5">
                    <AppListing />
                </div>
                <div className="flex-grow bg-white dark:bg-gray-900 overflow-x-auto">
                    {outlet}
                </div>
            </div>
        </div>
    </div>;
};

export default Dashboard;