import React, { useState, useEffect } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
    ColumnDef,
    CellContext,
    RowData,
} from '@tanstack/react-table';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    RefreshCw,
    Download,
    Trash2,
    Plus
} from 'lucide-react';
import { cn } from '../utils/cn';

declare module '@tanstack/react-table' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        editable?: boolean;
        type?: string;
        options?: string[];
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface TableMeta<TData extends RowData> {
        updateData: (id: string, field: string, value: unknown) => Promise<void>;
    }
}

interface EditableTableProps<TData> {
    data: TData[];
    columns: ColumnDef<TData, unknown>[];
    onUpdate: (id: string, field: string, value: unknown) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    onAdd?: () => void;
    isLoading?: boolean;
    onRefresh?: () => void;
    title: string;
    entityName: string;
}

const EditableCell = ({
    getValue,
    row,
    column,
    table,
}: CellContext<Record<string, unknown>, unknown>) => {
    const initialValue = getValue();
    const [value, setValue] = useState(initialValue);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const onBlur = async () => {
        setIsEditing(false);
        if (value !== initialValue) {
            setIsSaving(true);
            try {
                // Assuming students/teachers use user_id, others use id
                const original = row.original as Record<string, unknown>;
                const id = (original.user_id as string) || (original.id as string);
                await table.options.meta?.updateData(id, column.id, value);
            } catch (error: unknown) {
                console.error(error);
                setValue(initialValue); // Revert on error
            } finally {
                setIsSaving(false);
            }
        }
    };

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    if (!column.columnDef.meta?.editable) {
        return <span className="px-2">{value as React.ReactNode}</span>;
    }

    if (isEditing) {
        if (column.columnDef.meta?.type === 'select') {
            return (
                <select
                    value={value as string}
                    onChange={e => setValue(e.target.value)}
                    onBlur={onBlur}
                    autoFocus
                    className="w-full px-2 py-1 border rounded bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {(column.columnDef.meta?.options || []).map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );
        }
        return (
            <input
                value={value as string}
                onChange={e => setValue(e.target.value)}
                onBlur={onBlur}
                autoFocus
                className="w-full px-2 py-1 border rounded bg-white outline-none focus:ring-2 focus:ring-blue-500"
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={cn(
                "px-2 py-1 rounded cursor-pointer hover:bg-slate-100 transition-colors min-h-[1.5rem]",
                isSaving && "opacity-50 pointer-events-none"
            )}
        >
            {value as React.ReactNode}
            {isSaving && <RefreshCw size={12} className="inline ml-2 animate-spin text-blue-500" />}
        </div>
    );
};

export function EditableTable<TData>({
    data,
    columns: userColumns,
    onUpdate,
    onDelete,
    onAdd,
    isLoading,
    onRefresh,
    title,
    entityName
}: EditableTableProps<TData>) {
    const [globalFilter, setGlobalFilter] = useState('');

    const columns = React.useMemo(() => {
        const cols = userColumns.map(col => ({
            ...col,
            cell: col.cell || (EditableCell as unknown as ColumnDef<TData, unknown>['cell']),
        }));

        if (onDelete) {
            cols.push({
                id: 'actions',
                header: 'Actions / কাজ',
                cell: ({ row }: { row: { original: any } }) => {
                    const original = row.original as Record<string, unknown>;
                    const id = (original.user_id as string) || (original.id as string);
                    return (
                        <button
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete this record?')) {
                                    onDelete(id);
                                }
                            }}
                            className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    );
                }
            } as any);
        }
        return cols;
    }, [userColumns, onDelete]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
        meta: {
            updateData: onUpdate,
        },
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h2>
                    <p className="text-sm text-slate-500 font-medium">Manage {entityName} records with auto-save</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            value={globalFilter ?? ''}
                            onChange={e => setGlobalFilter(e.target.value)}
                            placeholder="Search everything..."
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                        />
                    </div>
                    <button
                        onClick={onRefresh}
                        className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
                        title="Refresh Data"
                    >
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                        title="Export CSV"
                    >
                        <Download size={20} />
                    </button>
                    {onAdd && (
                        <button
                            onClick={onAdd}
                            className="btn-3d-primary flex items-center gap-2"
                        >
                            <Plus size={20} /> <span className="hidden sm:inline">Add New</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id} className="bg-slate-50 border-b border-slate-100">
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id} className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={cn(
                                                        "flex items-center gap-2",
                                                        header.column.getCanSort() && "cursor-pointer select-none"
                                                    )}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                    {header.column.getCanSort() && <ArrowUpDown size={12} />}
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {table.getRowModel().rows.map(row => (
                                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="px-6 py-3 text-sm text-slate-600">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">Rows per page:</span>
                        <select
                            value={table.getState().pagination.pageSize}
                            onChange={e => table.setPageSize(Number(e.target.value))}
                            className="bg-transparent text-xs font-black text-slate-600 outline-none"
                        >
                            {[10, 20, 30, 40, 50].map(pageSize => (
                                <option key={pageSize} value={pageSize}>{pageSize}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-400">
                            Page <span className="text-slate-900">{table.getState().pagination.pageIndex + 1}</span> of{' '}
                            <span className="text-slate-900">{table.getPageCount()}</span>
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <ChevronsLeft size={16} />
                            </button>
                            <button
                                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <ChevronRight size={16} />
                            </button>
                            <button
                                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                            >
                                <ChevronsRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
