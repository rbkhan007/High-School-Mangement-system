import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { EditableTable } from '../components/EditableTable';
import api from '../services/api';
import {
    Users,
    UserSquare2,
    Calendar,
    FileSpreadsheet,
    Bell,
    ShieldAlert,
    MessageSquare,
    Database
} from 'lucide-react';
import { cn } from '../utils/cn';

const entities = [
    { id: 'students', name: 'Students', icon: Users, labelBn: 'শিক্ষার্থী' },
    { id: 'teachers', name: 'Teachers', icon: UserSquare2, labelBn: 'শিক্ষক' },
    { id: 'attendance', name: 'Attendance', icon: Calendar, labelBn: 'উপস্থিতি' },
    { id: 'exams', name: 'Exams', icon: FileSpreadsheet, labelBn: 'পরীক্ষা' },
    { id: 'notices', name: 'Notices', icon: Bell, labelBn: 'নোটিশ' },
    { id: 'grievances', name: 'Grievances', icon: ShieldAlert, labelBn: 'অভিযোগ' },
    { id: 'feedback', name: 'Feedback', icon: MessageSquare, labelBn: 'মতামত' },
    { id: 'library/books', name: 'Library', icon: Database, labelBn: 'লাইব্রেরি' },
    { id: 'scouts', name: 'Scouts', icon: ShieldAlert, labelBn: 'স্কাউটস' },
];

const AdminDataOverview = () => {
    const [activeEntity, setActiveEntity] = useState(entities[0]);
    const [data, setData] = useState<unknown[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/admin/${activeEntity.id}`);
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeEntity.id]);

    const handleUpdate = async (id: string, field: string, value: unknown) => {
        try {
            await api.put(`/admin/${activeEntity.id}/${id}`, { [field]: value });
            // Optionally refetch or update local state
            setData((prev: unknown[]) => (prev as Record<string, unknown>[]).map((item) => {
                const itemId = (item.user_id as string) || (item.id as string);
                return itemId === id ? { ...item, [field]: value } : item;
            }));
        } catch (error) {
            console.error('Update failed', error);
            throw error;
        }
    };

    const getColumns = () => {
        switch (activeEntity.id) {
            case 'students':
                return [
                    { accessorKey: 'student_id', header: 'ID / আইডি', meta: { editable: false } },
                    { accessorFn: (row: Record<string, unknown>) => (row.user as Record<string, unknown>).display_name, id: 'display_name', header: 'Name / নাম', meta: { editable: true } },
                    { accessorKey: 'class', header: 'Class / শ্রেণী', meta: { editable: true, type: 'select', options: ['6', '7', '8', '9', '10'] } },
                    { accessorKey: 'section', header: 'Section / শাখা', meta: { editable: true, type: 'select', options: ['A', 'B', 'C'] } },
                    { accessorKey: 'roll_number', header: 'Roll / রোল', meta: { editable: true } },
                ];
            case 'teachers':
                return [
                    { accessorKey: 'employee_id', header: 'EMP ID / আইডি', meta: { editable: false } },
                    { accessorFn: (row: Record<string, unknown>) => (row.user as Record<string, unknown>).display_name, id: 'display_name', header: 'Name / নাম', meta: { editable: true } },
                    { accessorKey: 'mpo_id', header: 'MPO ID', meta: { editable: true } },
                    { accessorKey: 'leave_balance', header: 'Leaves / ছুটি', meta: { editable: true } },
                ];
            case 'attendance':
                return [
                    { accessorFn: (row: Record<string, unknown>) => new Date(row.date as string).toLocaleDateString(), header: 'Date / তারিখ', meta: { editable: false } },
                    {
                        accessorFn: (row: Record<string, unknown>) => {
                            const student = row.student as Record<string, unknown> | undefined;
                            const user = student?.user as Record<string, unknown> | undefined;
                            return (user?.display_name as string) || '';
                        }, header: 'Student / শিক্ষার্থী', meta: { editable: false }
                    },
                    { accessorKey: 'status', header: 'Status / অবস্থা', meta: { editable: true, type: 'select', options: ['PRESENT', 'ABSENT', 'LATE'] } },
                ];
            case 'exams':
                return [
                    { accessorKey: 'name', header: 'Name / নাম', meta: { editable: true } },
                    { accessorKey: 'type', header: 'Type / ধরন', meta: { editable: true } },
                    { accessorKey: 'max_marks', header: 'Max / পূর্ণমান', meta: { editable: true } },
                    { accessorFn: (row: Record<string, unknown>) => new Date(row.start_date as string).toLocaleDateString(), header: 'Start / শুরু', meta: { editable: true } },
                ];
            case 'notices':
                return [
                    { accessorKey: 'title_en', header: 'Title (EN) / শিরোনাম (ইংরেজি)', meta: { editable: true } },
                    { accessorKey: 'title_bn', header: 'Title (BN) / শিরোনাম (বাংলা)', meta: { editable: true } },
                    { accessorKey: 'urgent', header: 'Urgent / জরুরি', meta: { editable: true, type: 'select', options: ['true', 'false'] } },
                ];
            case 'grievances':
                return [
                    { accessorKey: 'title', header: 'Title / শিরোনাম', meta: { editable: false } },
                    { accessorKey: 'status', header: 'Status / অবস্থা', meta: { editable: true, type: 'select', options: ['PENDING', 'ASSIGNED', 'RESOLVED', 'ESCALATED'] } },
                    { accessorKey: 'category', header: 'Category / বিভাগ', meta: { editable: true } },
                ];
            case 'feedback':
                return [
                    { accessorKey: 'name', header: 'Name / নাম', meta: { editable: false } },
                    { accessorKey: 'rating', header: 'Stars / রেটিং', meta: { editable: false } },
                    { accessorKey: 'message', header: 'Message / বার্তা', meta: { editable: false } },
                ];
            case 'library/books':
                return [
                    { accessorKey: 'title', header: 'Title / শিরোনাম', meta: { editable: true } },
                    { accessorKey: 'author', header: 'Author / লেখক', meta: { editable: true } },
                    { accessorKey: 'category', header: 'Category / বিভাগ', meta: { editable: true } },
                    { accessorKey: 'quantity', header: 'Quantity / পরিমাণ', meta: { editable: true } },
                ];
            case 'scouts':
                return [
                    { accessorFn: (row: any) => row.student?.user?.display_name, id: 'name', header: 'Name / নাম', meta: { editable: false } },
                    { accessorKey: 'rank', header: 'Rank / পদবী', meta: { editable: true } },
                    { accessorKey: 'status', header: 'Status / অবস্থা', meta: { editable: true, type: 'select', options: ['ACTIVE', 'INACTIVE'] } },
                ];
            default:
                return [];
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/admin/${activeEntity.id}/${id}`);
            setData((prev: unknown[]) => (prev as Record<string, unknown>[]).filter((item) => {
                const itemId = (item.user_id as string) || (item.id as string);
                return itemId !== id;
            }));
        } catch (error) {
            console.error('Delete failed', error);
            alert('Failed to delete record. Please check permissions.');
        }
    };

    const handleAdd = () => {
        if (activeEntity.id === 'notices') {
            const title = window.prompt('Enter Notice Title (English):');
            if (title) {
                api.post('/notices', { title_en: title, content_en: 'Default Content', urgent: false })
                    .then(() => fetchData());
            }
        } else {
            alert(`Adding new ${activeEntity.name} is handled via specific registration portals.`);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 p-4 bg-slate-50 min-h-screen">
            {/* Sidebar for Entity Selection */}
            <div className="w-full lg:w-72 space-y-2">
                <div className="flex items-center gap-3 px-4 py-6 mb-6">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <Database className="text-white w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="font-black text-xl text-slate-800 tracking-tight">Data Hub</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Admin Access</p>
                    </div>
                </div>

                <nav className="space-y-1">
                    {entities.map((entity) => (
                        <button
                            key={entity.id}
                            onClick={() => setActiveEntity(entity)}
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group",
                                activeEntity.id === entity.id
                                    ? "bg-white text-blue-600 shadow-xl shadow-slate-200/50 scale-105 border border-blue-50"
                                    : "text-slate-500 hover:bg-white hover:text-blue-600"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <entity.icon size={20} className={cn(
                                    "transition-transform group-hover:scale-110",
                                    activeEntity.id === entity.id && "text-blue-600"
                                )} />
                                <div className="text-left">
                                    <p className="text-sm font-black tracking-tight leading-none">{entity.name}</p>
                                    <p className="text-[10px] font-bold opacity-60 mt-1">{entity.labelBn}</p>
                                </div>
                            </div>
                            {activeEntity.id === entity.id && (
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-white lg:bg-transparent -mx-4 lg:mx-0 p-4 lg:p-0">
                <EditableTable
                    key={activeEntity.id}
                    title={`${activeEntity.name} / ${activeEntity.labelBn}`}
                    entityName={activeEntity.name.toLowerCase()}
                    data={data}
                    columns={getColumns() as ColumnDef<unknown, unknown>[]}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onAdd={activeEntity.id === 'notices' ? handleAdd : undefined}
                    isLoading={isLoading}
                    onRefresh={fetchData}
                />
            </div>
        </div>
    );
};

export default AdminDataOverview;
