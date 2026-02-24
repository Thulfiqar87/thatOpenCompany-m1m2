import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, Upload, Plus } from 'lucide-react';
import { useAppContext } from '../context/AppContext.tsx';
import ProjectForm from './Forms/ProjectForm.tsx';
import UserForm from './Forms/UserForm.tsx';
import type { Project } from '../types/index.ts';

const Header = () => {
    const location = useLocation();
    const { projects, users, importData } = useAppContext();

    const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
    const [isUserFormOpen, setIsUserFormOpen] = useState(false);

    // Determine Title based on route
    const isProjectsView = location.pathname.startsWith('/projects');
    const isUsersView = location.pathname.startsWith('/users');

    let title = 'Dashboard';
    if (isProjectsView) title = 'Projects';
    if (isUsersView) title = 'Users';

    // Handle Export
    const handleExport = () => {
        const dataStr = JSON.stringify({ projects, users }, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `app-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Handle Import
    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.projects && Array.isArray(json.projects)) {
                    importData(json.projects as Project[]);
                    alert('Data imported successfully!');
                } else {
                    alert('Invalid file format. Ensure it contains a "projects" array.');
                }
            } catch (err) {
                console.error(err);
                alert('Error parsing JSON file.');
            }
        };
        reader.readAsText(file);
        // reset input
        e.target.value = '';
    };

    return (
        <>
            <header className="h-24 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10 transition-all shadow-sm">
                <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleExport}
                        className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        <Download className="w-4 h-4 mr-2" /> Export
                    </button>

                    <label className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-colors cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" /> Import
                        <input
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={handleImport}
                        />
                    </label>

                    {isProjectsView && location.pathname === '/projects' && (
                        <button
                            onClick={() => setIsProjectFormOpen(true)}
                            className="flex items-center px-5 py-2.5 text-sm font-bold text-white bg-brand rounded-xl hover:bg-brand-dark transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/50 active:scale-95"
                        >
                            <Plus className="w-4 h-4 mr-2 stroke-[3]" /> New Project
                        </button>
                    )}

                    {isUsersView && (
                        <button
                            onClick={() => setIsUserFormOpen(true)}
                            className="flex items-center px-5 py-2.5 text-sm font-bold text-white bg-brand rounded-xl hover:bg-brand-dark transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/50 active:scale-95"
                        >
                            <Plus className="w-4 h-4 mr-2 stroke-[3]" /> Add User
                        </button>
                    )}
                </div>
            </header>

            {isProjectFormOpen && (
                <ProjectForm onClose={() => setIsProjectFormOpen(false)} />
            )}

            {isUserFormOpen && (
                <UserForm onClose={() => setIsUserFormOpen(false)} />
            )}
        </>
    );
};

export default Header;
