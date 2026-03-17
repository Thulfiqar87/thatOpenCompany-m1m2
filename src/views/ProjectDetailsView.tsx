import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3 } from 'lucide-react';
import { useAppContext } from '../context/AppContext.tsx';
import { getInitials, formatDate, getAvatarColor } from '../utils/helpers.ts';
import ProjectForm from '../components/Forms/ProjectForm.tsx';
import ProjectTasksList from '../components/ToDo/ProjectTasksList.tsx';

const ProjectDetailsView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { projects } = useAppContext();

    const project = projects.find(p => p.id === id);
    const bgColor = project ? getAvatarColor(project.id) : '';

    const [isEditing, setIsEditing] = useState(false);

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Project Not Found</h2>
                <button
                    onClick={() => navigate('/projects')}
                    className="text-brand font-medium hover:underline mt-4"
                >
                    Return to Projects
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
            <button
                onClick={() => navigate('/projects')}
                className="flex items-center text-sm font-medium text-slate-400 hover:text-white mb-6 transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Projects
            </button>

            {/* Project Header Card */}
            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl mb-8 relative overflow-hidden">
                {/* Decorative background blur - disabled pointer events to prevent blocking clicks */}
                <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none ${bgColor}`} />

                <div className="flex justify-between items-start mb-6 relative z-20">
                    <div className="flex items-center gap-5">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl ${bgColor} shadow-lg shrink-0 border border-slate-700`}>
                            <span className="uppercase">{getInitials(project.name)}</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">{project.name}</h1>
                            <div className="text-sm font-medium text-slate-400 mt-2 flex items-center gap-4">
                                <span>Value: </span>
                                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold leading-none inline-flex items-center">
                                    ${project.valueUSD.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-colors shadow-sm"
                        >
                            <Edit3 className="w-4 h-4 mr-2" /> Edit Project
                        </button>
                    </div>
                </div>

                {/* Project Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-800">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Location</p>
                        <p className="font-medium text-slate-300">{project.location || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</p>
                        <p className="font-medium text-slate-300">{formatDate(project.date)}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Assignee</p>
                        <p className="font-medium text-slate-300">{project.assignee || 'Unassigned'}</p>
                    </div>
                </div>
            </div>

            {/* ToDos Section */}
            <ProjectTasksList project={project} />

            {/* Edit Project Form Modal */}
            {isEditing && (
                <ProjectForm
                    initialData={project}
                    onClose={() => setIsEditing(false)}
                />
            )}
        </div>
    );
};

export default ProjectDetailsView;
