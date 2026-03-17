import { useNavigate } from 'react-router-dom';
import { Briefcase, Calendar, Trash2, Edit2, Linkedin } from 'lucide-react';
import type { User, Project } from '../types/index.ts';
import { getInitials, getAvatarColor } from '../utils/helpers.ts';
import { useState } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import UserForm from './Forms/UserForm.tsx';

interface UserCardProps {
    user: User;
}

const UserCard = ({ user }: UserCardProps) => {
    const navigate = useNavigate();
    const { projects, deleteUser } = useAppContext();
    const bgColor = getAvatarColor(user.id);
    const [isEditing, setIsEditing] = useState(false);

    // Map project IDs to project names for pills
    const assignedProjects = user.assignedProjectIds.map(id => {
        return projects.find(p => p.id === id);
    }).filter((p): p is Project => p !== undefined);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this user?')) {
            deleteUser(user.id);
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    return (
        <>
            <div className="relative bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 hover:shadow-2xl hover:shadow-black/50 transition-all flex flex-col h-full group">

                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                        onClick={handleEdit}
                        className="p-1.5 text-slate-400 hover:text-brand hover:bg-slate-800 rounded-lg transition-colors bg-slate-900/80 backdrop-blur-sm"
                        title="Edit user"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded-lg transition-colors bg-slate-900/80 backdrop-blur-sm"
                        title="Delete user"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-4 mb-4 pr-16">
                    {/* User Avatar - with fallback to initials */}
                    {user.photoUrl ? (
                        <img
                            src={user.photoUrl}
                            alt={user.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-slate-800 shadow-md group-hover:scale-105 transition-transform"
                        />
                    ) : (
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${bgColor} shadow-md group-hover:scale-105 transition-transform border-2 border-slate-800`}>
                            <span className="uppercase">{getInitials(user.name)}</span>
                        </div>
                    )}

                    <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-brand transition-colors">{user.name}</h3>
                        <p className="text-slate-400 font-medium">{user.position}</p>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center text-slate-500 text-sm">
                        <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                        <span>{user.position}</span>
                    </div>
                    <div className="flex items-center text-slate-500 text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                        <span>{user.dob}</span>
                    </div>
                    {user.linkedInUrl && (
                        <div className="flex items-center text-slate-500 text-sm">
                            <Linkedin className="w-4 h-4 mr-2 text-brand" />
                            <a
                                href={user.linkedInUrl.startsWith('http') ? user.linkedInUrl : `https://${user.linkedInUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand hover:underline truncate"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {user.linkedInUrl.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                        </div>
                    )}
                </div>

                {/* Assigned Projects Pills */}
                <div className="mt-auto pt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">Assigned Projects</p>
                    {assignedProjects.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {assignedProjects.map(project => (
                                <button
                                    key={project.id}
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                    className="px-3 py-1.5 bg-brand/10 text-brand text-xs font-semibold rounded-lg hover:bg-brand/20 transition-colors border border-brand/20 uppercase"
                                >
                                    {project.name}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 italic">No projects assigned</p>
                    )}
                </div>
            </div>
            {isEditing && (
                <UserForm
                    initialData={user}
                    onClose={() => setIsEditing(false)}
                />
            )}
        </>
    );
};

export default UserCard;
