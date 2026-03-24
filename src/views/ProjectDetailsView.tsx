import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, ListTodo, Box } from 'lucide-react';
import { useAppContext } from '../context/AppContext.tsx';
import { getInitials, formatDate, getAvatarColor, formatCurrency } from '../utils/helpers.ts';
import ProjectForm from '../components/Forms/ProjectForm.tsx';
import ProjectTasksList from '../components/ToDo/ProjectTasksList.tsx';
import BIMViewer from '../components/BIM/BIMViewer.tsx';

type ViewTab = 'bim' | 'tasks';

const ProjectDetailsView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { projects } = useAppContext();

    const project = projects.find(p => p.id === id);
    const bgColor = project ? getAvatarColor(project.id) : '';

    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<ViewTab>('bim');

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

    // ----------------------------------------------------------------
    // Tasks tab — original project detail content
    // ----------------------------------------------------------------
    if (activeTab === 'tasks') {
        return (
            <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
                {/* Breadcrumb / back */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/projects')}
                        className="flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        Projects
                    </button>
                    <span className="text-slate-700">·</span>
                    <button
                        onClick={() => setActiveTab('bim')}
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-brand transition-colors"
                    >
                        <Box className="w-4 h-4" />
                        BIM Viewer
                    </button>
                </div>

                {/* Project Header Card */}
                <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl mb-8 relative overflow-hidden">
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
                                        {formatCurrency(project.valueUSD)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-colors shadow-sm"
                        >
                            <Edit3 className="w-4 h-4 mr-2" /> Edit Project
                        </button>
                    </div>
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

                <ProjectTasksList project={project} />

                {isEditing && (
                    <ProjectForm
                        initialData={project}
                        onClose={() => setIsEditing(false)}
                    />
                )}
            </div>
        );
    }

    // ----------------------------------------------------------------
    // BIM tab — full-screen viewer with a slim project info bar
    // ----------------------------------------------------------------
    return (
        <>
            {/* Slim info bar sits inside the normal layout flow */}
            <div className="-mx-8 -mt-8 mb-0 px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center gap-4 z-10 relative">
                <button
                    onClick={() => navigate('/projects')}
                    className="flex items-center text-sm text-slate-400 hover:text-white transition-colors group shrink-0"
                >
                    <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                    Projects
                </button>

                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold ${bgColor} shrink-0`}>
                    {getInitials(project.name)}
                </div>
                <span className="font-semibold text-white text-sm truncate">{project.name}</span>
                <span className="text-slate-600 shrink-0">·</span>
                <span className="text-xs text-slate-500 shrink-0">{project.location}</span>
                <span className="text-slate-600 shrink-0">·</span>
                <span className="text-xs text-emerald-400 shrink-0">{formatCurrency(project.valueUSD)}</span>

                <div className="ml-auto flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                    >
                        <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit
                    </button>
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                    >
                        <ListTodo className="w-3.5 h-3.5 mr-1.5" /> Tasks
                    </button>
                    <button
                        onClick={() => setActiveTab('bim')}
                        className="flex items-center px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg"
                    >
                        <Box className="w-3.5 h-3.5 mr-1.5" /> BIM
                    </button>
                </div>
            </div>

            {/* The BIM viewer uses fixed positioning — it escapes the layout padding
                and fills from sidebar + header-bar to the viewport edges. */}
            <BIMViewer projectId={project.id} />

            {isEditing && (
                <ProjectForm
                    initialData={project}
                    onClose={() => setIsEditing(false)}
                />
            )}
        </>
    );
};

export default ProjectDetailsView;
