import { UilSpinner } from '@iconscout/react-unicons';
import { Application } from '@klave/db';
import { FC, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import { CircleOcticon, Timeline } from '@primer/react';
import { CubeIcon } from '@radix-ui/react-icons';
// import { UilSpinner } from '@iconscout/react-unicons';
// import api from '../../utils/api';

type ApplicationRecordProps = {
    application: Application
};

export const ApplicationRecord: FC<ApplicationRecordProps> = ({ application }) => {
    const { orgSlug } = useParams();
    return <Timeline.Item condensed >
        <Timeline.Badge>
            <CircleOcticon icon={CubeIcon} />
        </Timeline.Badge>
        <Timeline.Body>
            Created application <Link to={`/${orgSlug}/${application.slug}`} className='font-semibold'>{application.slug}</Link> <i>({formatTimeAgo(application.createdAt)})</i>
        </Timeline.Body>
    </Timeline.Item>;
};

export const OrganisationRecordListing: FC = () => {

    const { orgSlug } = useParams();
    const { data: applicationsList, isLoading: isLoadingActivities } = api.v0.applications.getByOrganisation.useQuery({ orgSlug: orgSlug || '' });
    const sortedApplications = useMemo(() => (applicationsList ?? []).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), [applicationsList]);

    if (isLoadingActivities || !applicationsList)
        return <>
            We are fetching data about your organisation's activities.<br />
            It will only take a moment...<br />
            <br />
            <UilSpinner className='inline-block animate-spin h-5' />
        </>;

    return <div className="w-full mb-7">
        <div className="hidden w-full items-center mb-7">
            <button className="btn btn-sm inline-flex mr-3 items-center h-8 pl-2.5 pr-2 rounded-md shadow text-gray-700 dark:text-gray-400 dark:border-gray-800 border border-gray-200 leading-none py-0">
                <svg viewBox="0 0 24 24" className="w-4 mr-2 text-gray-400 dark:text-gray-600" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Last 30 days
                <svg viewBox="0 0 24 24" className="w-4 ml-1.5 text-gray-400 dark:text-gray-600" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <button className="btn btn-sm inline-flex items-center h-8 pl-2.5 pr-2 rounded-md shadow text-gray-700 dark:text-gray-400 dark:border-gray-800 border border-gray-200 leading-none py-0">
                Filter by
                <svg viewBox="0 0 24 24" className="w-4 ml-1.5 text-gray-400 dark:text-gray-600" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
        </div>
        {sortedApplications.length === 0 ?
            <div className="w-full text-left">
                No recorded activities
            </div>
            :
            <div className="w-full text-left">
                <Timeline clipSidebar>
                    {sortedApplications.map(application => <ApplicationRecord key={application.id} application={application} />)}
                </Timeline>
            </div>
        }
    </div>;
};

export default OrganisationRecordListing;