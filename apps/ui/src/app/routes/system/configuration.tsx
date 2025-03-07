
import { useRef, useState, useMemo } from 'react';
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

function RunningConfiguration() {

    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [sorting, setSorting] = useState<SortingState>([]);

    //react-query has an useInfiniteQuery hook just for this situation!
    const { data, isLoading } = api.v0.system.getRunningConfiguration.useQuery();

    type AppResult = NonNullable<typeof data>;
    const columns = useMemo<ColumnDef<AppResult>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Name'
            },
            {
                accessorKey: 'value',
                header: 'Value'
            }
        ],
        []
    );

    //we must flatten the array of arrays from the useInfiniteQuery hook
    const flatData = useMemo(
        () => Object.entries(data ?? {}).map(([name, value]) => ({ name, value })),
        [data]
    );

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
        estimateSize: () => flatData.length,
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
                        Running Configuration
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
                    Running Configuration
                </div>
            </div>
        </div>
        <div className="sm:px-7 sm:pt-7 px-4 py-4 flex flex-col w-full bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 sticky top-0">
            <div className="flex w-full items-center">
                <div
                    className="h-full w-full max-w-full overflow-auto"
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
                                const row = rows[virtualRow.index] as Row<AppResult>;
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

export default RunningConfiguration;