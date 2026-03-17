import React, { useState, type ChangeEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { X, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext.tsx';
import type { User } from '../../types/index.ts';

interface UserFormProps {
    onClose: () => void;
    initialData?: User;
}

const UserForm = ({ onClose, initialData }: UserFormProps) => {
    const { addUser, updateUser, projects } = useAppContext();
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Helper to format stored date string "DD MMM YYYY" back to "YYYY-MM-DD" for HTML input
    const getFormattedDobForInput = (storedDob: string) => {
        if (!storedDob || storedDob === 'Unknown') return '';
        const d = new Date(storedDob);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().substring(0, 10);
    };

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        position: initialData?.position || '',
        dob: initialData?.dob ? getFormattedDobForInput(initialData.dob) : '',
        photoUrl: initialData?.photoUrl || '',
        assignedProjectIds: initialData?.assignedProjectIds || ([] as string[]),
        linkedInUrl: initialData?.linkedInUrl || ''
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (e.g., limit to 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setError('Photo size must be less than 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
            if (error) setError(null);
        };
        reader.readAsDataURL(file);
    };

    const handleProjectToggle = (projectId: string) => {
        setFormData(prev => {
            const isSelected = prev.assignedProjectIds.includes(projectId);
            if (isSelected) {
                return { ...prev, assignedProjectIds: prev.assignedProjectIds.filter(id => id !== projectId) };
            } else {
                return { ...prev, assignedProjectIds: [...prev.assignedProjectIds, projectId] };
            }
        });
    };

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();

        if (formData.name.trim().length < 3) {
            setError('User name must be at least 3 characters long.');
            return;
        }

        // Format DOB: YYYY-MM-DD to DD MMM YYYY if provided
        // Use T00:00:00 to parse as local time, avoiding UTC offset shifting the date
        let finalDob = formData.dob;
        if (finalDob) {
            const d = new Date(finalDob + 'T00:00:00');
            finalDob = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } else {
            finalDob = 'Unknown';
        }

        setIsSaving(true);
        setError(null);

        try {
            if (initialData) {
                await updateUser({
                    ...initialData,
                    name: formData.name.trim(),
                    position: formData.position.trim() || 'Team Member',
                    dob: finalDob,
                    photoUrl: formData.photoUrl.trim() || undefined,
                    assignedProjectIds: formData.assignedProjectIds,
                    linkedInUrl: formData.linkedInUrl.trim() || undefined
                });
            } else {
                const newUser: User = {
                    id: uuidv4(),
                    name: formData.name.trim(),
                    position: formData.position.trim() || 'Team Member',
                    dob: finalDob,
                    photoUrl: formData.photoUrl.trim() || undefined,
                    assignedProjectIds: formData.assignedProjectIds,
                    linkedInUrl: formData.linkedInUrl.trim() || undefined
                };
                await addUser(newUser);
            }

            onClose();
        } catch (err: unknown) {
            console.error('Error saving user:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to save User. Please try again.';
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
                        {initialData ? 'Edit User' : 'Add New User'}
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
                            Full Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. John Doe"
                            className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all placeholder:text-slate-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1" htmlFor="linkedInUrl">
                            LinkedIn URL
                        </label>
                        <input
                            type="url"
                            id="linkedInUrl"
                            name="linkedInUrl"
                            value={formData.linkedInUrl}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/in/username"
                            className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all placeholder:text-slate-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1" htmlFor="position">
                                Position
                            </label>
                            <input
                                type="text"
                                id="position"
                                name="position"
                                value={formData.position}
                                onChange={handleChange}
                                placeholder="e.g. Engineer"
                                className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1" htmlFor="dob">
                                Date of Birth
                            </label>
                            <input
                                type="date"
                                id="dob"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                                className="w-full p-3 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1" htmlFor="photoUrl">
                            Profile Photo
                        </label>

                        {formData.photoUrl ? (
                            <div className="flex items-center gap-4 mb-3 p-3 border border-slate-800 rounded-xl bg-slate-900">
                                <img
                                    src={formData.photoUrl}
                                    alt="Preview"
                                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-700 shadow-sm"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-300">Photo selected</p>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, photoUrl: '' }))}
                                        className="text-xs font-semibold text-rose-500 hover:text-rose-400 mt-1"
                                    >
                                        Remove Photo
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <input
                                type="file"
                                id="photoUrl"
                                name="photoUrl"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 cursor-pointer"
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Assign to Projects
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-slate-800 rounded-xl p-2 bg-slate-900/50 space-y-1">
                            {projects.length === 0 ? (
                                <p className="text-sm text-slate-500 p-2 text-center">No projects available</p>
                            ) : (
                                projects.map(project => (
                                    <label key={project.id} className="flex items-center p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-brand rounded border-slate-700 bg-slate-800 focus:ring-brand focus:ring-offset-slate-900"
                                            checked={formData.assignedProjectIds.includes(project.id)}
                                            onChange={() => handleProjectToggle(project.id)}
                                        />
                                        <span className="ml-3 text-sm text-slate-300 font-medium">{project.name}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-colors"
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
                            {initialData ? (isSaving ? 'Saving...' : 'Save Changes') : (isSaving ? 'Adding...' : 'Add User')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;
