import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { X, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext.tsx';
import type { Project } from '../../types/index.ts';

interface ProjectFormProps {
    onClose: () => void;
    initialData?: Project;
}

const ProjectForm = ({ onClose, initialData }: ProjectFormProps) => {
    const { addProject, updateProject, users } = useAppContext();
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        valueUSD: initialData?.valueUSD?.toString() || '',
        location: initialData?.location || '',
        date: initialData?.date ? initialData.date.substring(0, 10) : '',
        assignee: initialData?.assignee || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();

        // Form Validation: Name length < 5
        if (formData.name.trim().length < 5) {
            setError('Project name must be at least 5 characters long.');
            return;
        }

        // Default Date Logic
        // Use T00:00:00 to parse as local time, avoiding UTC offset shifting the date
        let finalDate = formData.date;
        if (!finalDate.trim()) {
            finalDate = new Date().toISOString();
        } else {
            finalDate = new Date(finalDate + 'T00:00:00').toISOString();
        }

        setIsSaving(true);
        setError(null);

        try {
            if (initialData) {
                const updatedProjectData: Project = {
                    ...initialData,
                    name: formData.name.trim(),
                    valueUSD: Number(formData.valueUSD) || 0,
                    location: formData.location.trim(),
                    date: finalDate,
                    assignee: formData.assignee.trim(),
                };

                // Update locally (AppContext handles Firestore sync now)
                await updateProject(updatedProjectData);
            } else {
                const newProject: Project = {
                    id: uuidv4(),
                    name: formData.name.trim(),
                    valueUSD: Number(formData.valueUSD) || 0,
                    location: formData.location.trim(),
                    date: finalDate,
                    assignee: formData.assignee.trim(),
                    todos: []
                };

                // Update locally (AppContext handles Firestore sync now)
                await addProject(newProject);
            }

            onClose();
        } catch (err: unknown) {
            console.error('Error saving project:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to save Project. Please try again.';
            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
                    <h2 className="text-xl font-bold text-white">
                        {initialData ? 'Edit Project' : 'Create New Project'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
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
                        <label className="block text-sm font-semibold text-slate-300 mb-1" htmlFor="name">
                            Project Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Project Apollo"
                            className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all placeholder:text-slate-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1" htmlFor="valueUSD">
                                Value (USD)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-slate-500 font-medium">$</span>
                                <input
                                    type="number"
                                    id="valueUSD"
                                    name="valueUSD"
                                    value={formData.valueUSD}
                                    onChange={handleChange}
                                    min="0"
                                    placeholder="0"
                                    className="w-full p-3 pl-8 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1" htmlFor="date">
                                Date
                            </label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full p-3 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all [color-scheme:dark]"
                            />
                            <p className="text-xs text-slate-500 mt-1">Leaves empty for today</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1" htmlFor="location">
                            Location
                        </label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g. New York, NY"
                            className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all placeholder:text-slate-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1" htmlFor="assignee">
                            Assignee
                        </label>
                        <select
                            id="assignee"
                            name="assignee"
                            value={formData.assignee}
                            onChange={handleSelectChange}
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
                            disabled={isSaving}
                            className="px-5 py-2.5 text-sm font-semibold text-slate-950 bg-brand rounded-xl hover:bg-brand-light shadow-lg shadow-brand/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {isSaving && (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {initialData ? (isSaving ? 'Saving...' : 'Save Changes') : (isSaving ? 'Creating...' : 'Create Project')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectForm;
