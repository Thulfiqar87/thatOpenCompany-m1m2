import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { X, Save, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import type { ToDo, TodoStatus, TodoPriority } from '../../types';

interface TodoFormProps {
    projectId: string;
    onClose: () => void;
    onSaveSuccess: (todo: ToDo) => void;
    initialData?: ToDo;
}

const TodoForm = ({ projectId, onClose, onSaveSuccess, initialData }: TodoFormProps) => {
    const { users } = useAppContext();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [task, setTask] = useState(initialData?.task || '');
    const [assignee, setAssignee] = useState(initialData?.assignee || '');
    const [status, setStatus] = useState<TodoStatus>(initialData?.status || 'pending');
    const [priority, setPriority] = useState<TodoPriority>(initialData?.priority || 'medium');

    useEffect(() => {
        if (error) setError(null);
    }, [task, status, priority]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        if (!task.trim()) {
            setError('Task name cannot be empty.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const todoId = initialData?.id || uuidv4();
            const newTodo: ToDo = {
                id: todoId,
                projectId,
                task: task.trim(),
                status,
                priority,
                assignee: assignee.trim(),
                createdAt: initialData?.createdAt || new Date().toISOString()
            };

            // Pass the generated Todo back to the parent to handle context updates
            onSaveSuccess(newTodo);
            onClose();
        } catch (err: unknown) {
            console.error('Error creating ToDo:', err);
            setError('Failed to create ToDo. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
                    <h2 className="text-xl font-bold text-white">
                        {initialData ? 'Edit Task' : 'New Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                        disabled={isSaving}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-4 bg-rose-500/10 text-rose-400 text-sm rounded-xl flex items-start border border-rose-500/20">
                            <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1">
                            Task Description *
                        </label>
                        <input
                            type="text"
                            value={task}
                            onChange={(e) => setTask(e.target.value)}
                            placeholder="What needs to be done?"
                            className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all placeholder:text-slate-500"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1">
                            Assignee (Optional)
                        </label>
                        <select
                            value={assignee}
                            onChange={(e) => setAssignee(e.target.value)}
                            className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all cursor-pointer"
                        >
                            <option value="">Unassigned</option>
                            {users.map(user => (
                                <option key={user.id} value={user.name}>
                                    {user.name} ({user.position})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1">
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as TodoStatus)}
                                className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all cursor-pointer"
                            >
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1">
                                Priority
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as TodoPriority)}
                                className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all cursor-pointer"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-5 py-2.5 text-sm font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || !task.trim()}
                            className="flex items-center px-5 py-2.5 text-sm font-semibold text-slate-950 bg-brand rounded-xl hover:bg-brand-light shadow-lg shadow-brand/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : initialData ? 'Save Changes' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TodoForm;
