
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
import { useVirtualizer } from '@tanstack/react-virtual';
import { UilSpinner } from '@iconscout/react-unicons';
import api from '../../utils/api';
import CreditDisplay from '../../components/CreditDisplay';

function Organisations() {

    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [sorting, setSorting] = useState<SortingState>([]);

    //react-query has an useInfiniteQuery hook just for this situation!
    const { data, fetchNextPage, isFetching, isLoading } = api.v0.organisations.infiniteOrganisations.useInfiniteQuery({
        filterUnitialized: true,
        limit: 50
    }, {
        getNextPageParam: (lastPage) => lastPage.nextCursor
    });

    type OrgResult = NonNullable<typeof data>['pages'][number]['data'][number];
    const columns = useMemo<ColumnDef<OrgResult>[]>(
        () => [
            {
                accessorKey: 'slug',
                header: 'Slug',
                cell: info => <span>{info.getValue<string>().replace('~$~', '')}</span>
            },
            {
                accessorKey: 'creator',
                header: 'Owner',
                cell: info => {
                    const creator = info.getValue<OrgResult['creator']>();
                    if (!creator) return null;
                    return <span title={creator.emails[0]}>{creator.slug}</span>;
                }
            },
            {
                accessorKey: 'applications',
                header: 'Applications',
                cell: info => {
                    const applications = info.getValue<OrgResult['applications']>();
                    return <span>{applications.length}</span>;
                }
            },
            {
                accessorKey: 'kredits',
                header: 'Kredits',
                cell: info => <CreditDisplay compact kredits={info.getValue<number>()} />
            },
            {
                accessorKey: 'id',
                header: 'ID',
                cell: info => <span className='font-mono kbd kbd-xs text-nowrap mx-1 px-1 py-0 rounded-sm'>{info.getValue<string>()}</span>
            },
            {
                accessorKey: 'createdAt',
                header: 'Created At',
                cell: info => info.getValue<Date>().toLocaleString()
            }
        ],
        []
    );

    //we must flatten the array of arrays from the useInfiniteQuery hook
    const flatData = useMemo(
        () => data?.pages?.flatMap(page => page.data) ?? [],
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
            <div className="sm:px-7 sm:pt-7 px-4 py-4 flex flex-col w-full border-b border-border sticky top-0">
                <div className="flex w-full items-center">
                    <div className="font-medium flex items-center text-3xl text-gray-900 dark:text-white">
                        Organisations
                    </div>
                </div>
            </div>
            <div className="sm:px-7 sm:pt-7 px-4 py-4 flex flex-col w-full bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 sticky top-0">
                <div className="flex w-full items-center">
                    Loading... <UilSpinner className='inline-block animate-spin h-8' />
                </div>
            </div>
        </>;
    }

    return <>
        <div className="sm:px-7 sm:pt-7 px-4 py-4 flex flex-col w-full border-b border-border sticky top-0">
            <div className="flex w-full items-center">
                <div className="font-medium flex items-center text-3xl text-gray-900 dark:text-white">
                    Organisations ({data?.pages?.[0]?.meta?.totalRowCount ?? 0})
                </div>
            </div>
        </div>
        <div className="sm:px-7 sm:pt-7 px-4 py-4 flex flex-col w-full bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 sticky top-0">
            <div className="flex w-full items-center">
                <div
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
                                                className='text-left first-of-type:pl-4 py-2 border-b border-border bg-gray-50 dark:bg-gray-900 dark:text-white text-sm font-medium text-gray-500 uppercase tracking-wider'
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
                                const row = rows[virtualRow.index] as Row<OrgResult>;
                                return (
                                    <tr key={row.id} className='hover:bg-slate-50'>
                                        {row.getVisibleCells().map(cell => {
                                            return (
                                                <td key={cell.id} className='first-of-type:pl-3 p-2'>
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
                </div>

            </div>
        </div>
    </>;
}

export default Organisations;