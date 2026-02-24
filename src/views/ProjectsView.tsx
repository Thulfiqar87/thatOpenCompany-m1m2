import { useAppContext } from '../context/AppContext.tsx';
import ProjectCard from '../components/ProjectCard.tsx';

const ProjectsView = () => {
    const { projects } = useAppContext();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50">
                    <h2 className="text-2xl font-bold text-slate-200 mb-2">No Projects Yet</h2>
                    <p className="text-slate-400 max-w-sm">Create your first project to start tracking progress, value, and assignments.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectsView;
