// import { Link } from 'react-router-dom';

function Monitoring() {
    return <>
        <div className="sm:px-7 sm:pt-7 px-4 py-4 flex flex-col w-full border-b border-gray-200 bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 sticky top-0">
            <div className="flex w-full items-center">
                <div className="font-medium flex items-center text-3xl text-gray-900 dark:text-white">
                    Monitoring
                </div>
            </div>
        </div>
        <div className="sm:px-7 sm:pt-7 px-4 py-4 flex flex-col w-full bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 sticky top-0">
            <div className="flex w-full items-center">
                Everyting running nominal
            </div>
        </div>
    </>;
}

export default Monitoring;