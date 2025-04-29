
import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    Row,
    SortingState,
    useReactTable
} from '@tanstack/react-table';
import { useParams } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { UilSpinner } from '@iconscout/react-unicons';
import api from '../../utils/api';
import CostDisplay from '../../components/CostDisplay';

function ApplicationUsage() {

    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [sorting, setSorting] = useState<SortingState>([]);
    const { appSlug, orgSlug } = useParams();

    //react-query has an useInfiniteQuery hook just for this situation!
    const { data, fetchNextPage, isFetching, isLoading } = api.v0.applications.infiniteUsage.useInfiniteQuery({
        appSlug: appSlug || '',
        orgSlug: orgSlug || '',
        limit: 50
    }, {
        getNextPageParam: (lastPage) => lastPage.nextCursor
    });

    type UsageResult = NonNullable<typeof data>['pages'][number]['data'][number];
    const columns = useMemo<ColumnDef<UsageResult>[]>(
        () => [
            {
                id: 'is_transaction',
                accessorKey: 'data.consumption.is_transaction',
                header: 'Class',
                size: 50,
                cell: info => {
                    const isTransaction = info.getValue<UsageResult['data']['consumption']['is_transaction']>();
                    return isTransaction ? <span className="w-8 border rounded border-violet-400 bg-violet-100 text-violet-500 text-xs px-2">Tx</span> : <span className="w-8 border rounded border-blue-400 bg-blue-100 text-blue-500 text-xs px-2">Qy</span>;
                }
            },
            {
                accessorKey: 'data.consumption.call_type',
                header: 'Type',
                size: 50,
                cell: info => {
                    const callType = info.getValue<UsageResult['data']['consumption']['call_type']>();
                    return <span className="w-8 border rounded border-gray-400 bg-gray-100 text-gray-500 text-xs px-2">{callType}</span>;
                }
            },
            {
                accessorKey: 'data.consumption.fqdn',
                header: 'FQDN',
                cell: info => {
                    const fqdn = info.getValue<UsageResult['data']['consumption']['fqdn']>();
                    return <span title={fqdn} className='font-mono bg-gray-100 py-1 px-2 rounded truncate'>{fqdn}</span>;
                }
            },
            {
                accessorKey: 'data.consumption.ingress_in_bytes',
                header: 'Ingress',
                cell: info => {
                    const bytes = info.getValue<UsageResult['data']['consumption']['ingress_in_bytes']>();
                    const isTransaction = info.row.getValue<UsageResult['data']['consumption']['is_transaction']>('is_transaction');
                    return <CostDisplay type='ingress' scope={isTransaction ? 'transaction' : 'query'} compact consumption={bytes} />;
                }
            },
            {
                accessorKey: 'data.consumption.egress_in_bytes',
                header: 'Egress',
                cell: info => {
                    const bytes = info.getValue<UsageResult['data']['consumption']['egress_in_bytes']>();
                    const isTransaction = info.row.getValue<UsageResult['data']['consumption']['is_transaction']>('is_transaction');
                    return <CostDisplay type='egress' scope={isTransaction ? 'transaction' : 'query'} compact consumption={bytes} />;
                }
            },
            {
                accessorKey: 'data.consumption.ledger_write_in_bytes',
                header: 'Write',
                cell: info => {
                    const bytes = info.getValue<UsageResult['data']['consumption']['ledger_write_in_bytes']>();
                    const isTransaction = info.row.getValue<UsageResult['data']['consumption']['is_transaction']>('is_transaction');
                    return <CostDisplay type='write' scope={isTransaction ? 'transaction' : 'query'} compact consumption={bytes} />;
                }
            },
            {
                accessorKey: 'data.consumption.ledger_read_in_bytes',
                header: 'Read',
                cell: info => {
                    const bytes = info.getValue<UsageResult['data']['consumption']['ledger_read_in_bytes']>();
                    const isTransaction = info.row.getValue<UsageResult['data']['consumption']['is_transaction']>('is_transaction');
                    return <CostDisplay type='read' scope={isTransaction ? 'transaction' : 'query'} compact consumption={bytes} />;
                }
            },
            {
                accessorKey: 'data.consumption.cpu_consumption',
                header: 'WASM',
                cell: info => {
                    const CPUConsumption = info.getValue<UsageResult['data']['consumption']['cpu_consumption']>();
                    const isTransaction = info.row.getValue<UsageResult['data']['consumption']['is_transaction']>('is_transaction');
                    return <CostDisplay type='wasm' scope={isTransaction ? 'transaction' : 'query'} compact consumption={CPUConsumption} />;
                }
            },
            {
                accessorKey: 'data.consumption.native_calls_consumption',
                header: 'Native',
                cell: info => {
                    const NativeConsumption = info.getValue<UsageResult['data']['consumption']['native_calls_consumption']>();
                    const isTransaction = info.row.getValue<UsageResult['data']['consumption']['is_transaction']>('is_transaction');
                    return <CostDisplay type='native' scope={isTransaction ? 'transaction' : 'query'} compact consumption={NativeConsumption} />;
                }
            },
            {
                accessorKey: 'data.consumption.timestamp',
                header: 'Date',
                size: 120,
                cell: info => {
                    const timestamp = info.getValue<UsageResult['data']['consumption']['timestamp']>();
                    const dateTime = new Date(timestamp / 1_000_000);
                    return dateTime.toLocaleString();
                }
            }
        ],
        []
    );

    //we must flatten the array of arrays from the useInfiniteQuery hook
    const flatData = useMemo(
        () => {
            // Remove duplicate entries here
            // TODO: This is a temporary fix, we need to handle this in the backend
            const workingArray = data?.pages?.flatMap(page => page.data) ?? [];
            const workingMap = new Map<string, UsageResult>();
            workingArray.forEach(item => {
                workingMap.set(item.id, item);
            });
            return Array.from(workingMap.values());
        },
        [data]
    );
    const totalDBRowCount = data?.pages?.[0]?.meta?.totalRowCount ?? 0;
    const totalFetched = flatData.length;

    //called on scroll and possibly on mount to fetch more data as the user scrolls and reaches bottom of table
    const fetchMoreOnBottomReached = useCallback(
        (containerRefElement?: HTMLDivElement | null) => {
            if (containerRefElement) {
                const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
                //once the user has scrolled within 300px of the bottom of the table, fetch more data if there is any
                if (
                    scrollHeight - scrollTop - clientHeight < 300 &&
                    !isFetching &&
                    totalFetched < totalDBRowCount
                ) {
                    fetchNextPage()
                        .catch(err => {
                            console.error(err);
                        });
                }
                const activePanel = containerRefElement.closest('.app-content-panel');
                if (activePanel) {
                    const { clientHeight: parentClientHeight } = activePanel;
                    if (clientHeight < parentClientHeight &&
                        !isFetching &&
                        totalFetched < totalDBRowCount) {
                        fetchNextPage()
                            .catch(err => {
                                console.error(err);
                            });
                    }
                }
            }
        },
        [fetchNextPage, isFetching, totalFetched, totalDBRowCount]
    );

    //a check on mount and after a fetch to see if the table is already scrolled to the bottom and immediately needs to fetch more data
    useEffect(() => {
        fetchMoreOnBottomReached(tableContainerRef.current);
    }, [fetchMoreOnBottomReached]);

    const table = useReactTable({
        data: flatData,
        columns,
        state: {
            sorting
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel()
    });

    const { rows } = table.getRowModel();

    //Virtualizing is optional, but might be necessary if we are going to potentially have hundreds or thousands of rows
    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => 100,
        overscan: 10
    });

    const totalSize = rowVirtualizer.getTotalSize();
    const virtualRows = rowVirtualizer.getVirtualItems();
    const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
    const paddingBottom =
        virtualRows.length > 0
            ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
            : 0;

    if (isLoading) {
        return <>
            We are fetching your usage data.<br />
            It will only take a moment...<br />
            <br />
            <UilSpinner className='inline-block animate-spin h-5' />
        </>;
    }

    return <div
        id="usage-table-container"
        className="h-full w-full max-w-full overflow-auto"
        onScroll={e => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
        ref={tableContainerRef}
    >
        <table className='min-w-full'>
            <thead>
                {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => {
                            return (
                                <th
                                    key={header.id}
                                    colSpan={header.colSpan}
                                    style={{ width: header.getSize() }}
                                    className='text-left first-of-type:pl-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-white text-sm font-medium text-gray-500 uppercase tracking-wider'
                                >
                                    {header.isPlaceholder ? null : (
                                        <div
                                            {...{
                                                className: header.column.getCanSort()
                                                    ? 'cursor-pointer select-none'
                                                    : '',
                                                onClick: header.column.getToggleSortingHandler()
                                            }}
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                            {{
                                                asc: ' 🔼',
                                                desc: ' 🔽'
                                            }[header.column.getIsSorted() as string] ?? null}
                                        </div>
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                ))}
            </thead>
            <tbody>
                {paddingTop > 0 && (
                    <tr>
                        <td style={{ height: `${paddingTop}px` }} />
                    </tr>
                )}
                {virtualRows.map(virtualRow => {
                    const row = rows[virtualRow.index] as Row<UsageResult>;
                    return (
                        <tr key={row.id} className='hover:bg-slate-50'>
                            {row.getVisibleCells().map(cell => {
                                return (
                                    <td key={cell.id} className={`first-of-type:pl-3 p-2 ${(cell.column.columnDef as unknown as Record<string, string>).accessorKey === 'data.consumption.fqdn' ? 'truncate max-w-32' : ''}`}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
                {paddingBottom > 0 && (
                    <tr>
                        <td style={{ height: `${paddingBottom}px` }} />
                    </tr>
                )}
            </tbody>
        </table>
    </div>;
}

export default ApplicationUsage;