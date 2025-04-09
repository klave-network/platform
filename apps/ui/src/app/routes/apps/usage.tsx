import { FC, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { UilSpinner } from '@iconscout/react-unicons';
import api from '../../utils/api';
import { UsageRecord } from '@klave/db';

type UsageRecordProps = {
    usage: UsageRecord
};

const UsageRecord: FC<UsageRecordProps> = ({ usage }) => {

    const { data: { consumption } } = usage;
    const { is_transaction, cpu_consumption, native_calls_consumption, fqdn, timestamp } = consumption ?? {};
    const dateTime = new Date(timestamp / 1_000_000);

    const CPUConsumptionNumber = Number(cpu_consumption);
    let CPUConsumption = CPUConsumptionNumber / 100_000_000;
    if (CPUConsumptionNumber > 0 && CPUConsumptionNumber < 1_000_000)
        CPUConsumption = 0.01;

    const NativeConsumptionNumber = Number(native_calls_consumption);
    let NativeConsumption = NativeConsumptionNumber / 100_000_000;
    if (NativeConsumptionNumber > 0 && NativeConsumptionNumber < 1_000_000)
        NativeConsumption = 0.01;

    return <tr>
        <td className="px-1 border-b border-gray-200 dark:border-gray-800 md:table-cell hidden">
            <div className="flex items-center" >
                {is_transaction ? <span className="w-8 border rounded border-violet-400 bg-violet-100 text-violet-500 text-xs px-2">Tx</span> : <span className="w-8 border rounded border-blue-400 bg-blue-100 text-blue-500 text-xs px-2">Qy</span>}
            </div>
        </td>
        <td className="px-1 border-b border-gray-200 dark:border-gray-800 overflow-hidden max-w-32 truncate" title={fqdn}><span className='font-mono bg-gray-100 py-1 px-2 rounded truncate'>{fqdn}</span></td>
        <td className={'px-1 border-b border-gray-200 dark:border-gray-800'}>£{CPUConsumption}<br /><span className='text-xs'>{cpu_consumption.toString()}</span></td>
        <td className={'px-1 border-b border-gray-200 dark:border-gray-800'}>£{NativeConsumption}<br /><span className='text-xs'>{native_calls_consumption.toString()}</span></td>
        <td className={'px-1 border-b border-gray-200 dark:border-gray-800'}>{dateTime.toUTCString()}</td>
    </tr>;
};

export const UsageListing: FC = () => {

    const { appSlug, orgSlug } = useParams();
    const { data, isLoading } = api.v0.applications.infiniteUsage.useInfiniteQuery({
        appSlug: appSlug || '',
        orgSlug: orgSlug || '',
        limit: 100
    }, {
        getNextPageParam: (lastPage) => lastPage?.nextCursor
    });

    // const { data: application } = api.v0.applications.getBySlug.useQuery({ appSlug: appSlug || '', orgSlug: orgSlug || '' });
    // const { data: usagesList, isLoading } = api.v0.usages.getByApplication.useQuery({ appId: application?.id || '' });
    // const [addingUsage, setAddingUsage] = useState(false);

    //we must flatten the array of arrays from the useInfiniteQuery hook
    const flatData = useMemo(
        () => (data?.pages?.flatMap(page => page?.data ?? []) ?? []),
        [data?.pages]
    );
    // const totalDBRowCount = data?.pages?.[0]?.meta?.totalRowCount ?? 0;
    // const totalFetched = flatData.length;

    if (isLoading)
        return <>
            We are fetching your usage data.<br />
            It will only take a moment...<br />
            <br />
            <UilSpinner className='inline-block animate-spin h-5' />
        </>;

    return <>
        <table className="w-full text-left">
            <thead>
                <tr className="text-gray-400">
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Class</th>
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">FQDN</th>
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">WASM</th>
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Native</th>
                    <th className="font-normal px-3 pt-0 pb-3 border-b border-gray-200 dark:border-gray-800">Date</th>
                </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-100">
                {flatData.map(usage => <UsageRecord key={usage.id} usage={usage} />)}
            </tbody>
        </table>
    </>;
};

export default UsageListing;