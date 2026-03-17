import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, User as UserIcon, Trash2, Edit2, Plus } from 'lucide-react';
import type { Project, ToDo, TodoStatus } from '../types/index.ts';
import { getInitials, formatCurrency, formatDate, getAvatarColor } from '../utils/helpers.ts';
import { useState } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import ProjectForm from './Forms/ProjectForm.tsx';
import { v4 as uuidv4 } from 'uuid';

interface ProjectCardProps {
    project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
    const navigate = useNavigate();
    const { deleteProject, updateProject } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [newTodoText, setNewTodoText] = useState('');

    // Assign a stable random color for this card instance, or we could store this in the Project object
    // For now, useMemo keeps it stable during re-renders,
    // but true persistence would require adding a color field to Project interface.
    const bgColor = getAvatarColor(project.id);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this project?')) {
            deleteProject(project.id);
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleTodoStatusChange = (todoId: string, checked: boolean) => {
        const updatedStatus: TodoStatus = checked ? 'completed' : 'pending';
        const updatedTodos = project.todos.map(t =>
            t.id === todoId ? { ...t, status: updatedStatus } : t
        );
        updateProject({ ...project, todos: updatedTodos });
    };

    const handleTodoTextChange = (todoId: string, text: string) => {
        const updatedTodos = project.todos.map(t =>
            t.id === todoId ? { ...t, task: text } : t
        );
        updateProject({ ...project, todos: updatedTodos });
    };

    const handleTodoDelete = (todoId: string) => {
        const updatedTodos = project.todos.filter(t => t.id !== todoId);
        updateProject({ ...project, todos: updatedTodos });
    };

    const submitNewTodo = () => {
        if (newTodoText.trim()) {
            const newTodo: ToDo = {
                id: uuidv4(),
                projectId: project.id,
                task: newTodoText.trim(),
                status: 'pending',
                priority: 'medium',
                createdAt: new Date().toISOString()
            };
            updateProject({ ...project, todos: [...project.todos, newTodo] });
            setNewTodoText('');
        }
    };

    const handleAddTodo = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            submitNewTodo();
        }
    };

    return (
        <>
            <div
                onClick={() => navigate(`/projects/${project.id}`)}
                className="relative bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 hover:shadow-2xl hover:shadow-black/50 transition-all cursor-pointer group flex flex-col h-full"
            >
                <div
                    className="absolute top-4 right-4 flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={handleEdit}
                        className="p-1.5 text-slate-400 hover:text-brand hover:bg-slate-800 rounded-lg transition-colors bg-slate-900/80 backdrop-blur-sm"
                        title="Edit project"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded-lg transition-colors bg-slate-900/80 backdrop-blur-sm"
                        title="Delete project"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-start justify-between mb-4 pr-16">
                    {/* Project Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${bgColor} shadow-sm group-hover:scale-105 transition-transform ring-4 ring-slate-900`}>
                        <span className="uppercase">{getInitials(project.name)}</span>
                    </div>
                    <div className="bg-slate-800 text-slate-200 text-sm font-semibold px-3 py-1 rounded-full border border-slate-700">
                        {formatCurrency(project.valueUSD)}
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-brand transition-colors">
                    {project.name}
                </h3>

                <div className="space-y-2 mt-auto pt-4">
                    <div className="flex items-center text-slate-500 text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                        <span className="truncate">{project.location}</span>
                    </div>

                    <div className="flex items-center text-slate-500 text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                        <span>{formatDate(project.date)}</span>
                    </div>

                    <div className="flex items-center text-slate-500 text-sm">
                        <UserIcon className="w-4 h-4 mr-2 text-slate-400" />
                        <span className="truncate">{project.assignee}</span>
                    </div>
                </div>

                {/* Progress / Todos Summary */}
                <div className="mt-6 pt-4 border-t border-slate-800">
                    <div className="flex justify-between items-center text-xs text-slate-400 font-medium mb-2">
                        <span>Tasks Progress</span>
                        <span>
                            {project.todos.filter(t => t.status === 'completed').length} / {project.todos.length}
                        </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-brand h-1.5 rounded-full transition-all duration-500"
                            style={{
                                width: project.todos.length > 0
                                    ? `${(project.todos.filter(t => t.status === 'completed').length / project.todos.length) * 100}%`
                                    : '0%'
                            }}
                        />
                    </div>
                </div>

                {/* To-Do List */}
                <div
                    className="mt-4 space-y-1.5 flex-1 overflow-y-auto max-h-48 pr-1"
                    onClick={(e) => e.stopPropagation()}
                >
                    {project.todos.map(todo => (
                        <div
                            key={todo.id}
                            className="flex items-center gap-2 group/todo"
                        >
                            <input
                                type="checkbox"
                                checked={todo.status === 'completed'}
                                onChange={(e) => handleTodoStatusChange(todo.id, e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand transition-colors cursor-pointer"
                            />
                            <input
                                type="text"
                                value={todo.task}
                                onChange={(e) => handleTodoTextChange(todo.id, e.target.value)}
                                className={`flex-1 text-sm bg-transparent border border-transparent hover:border-slate-700 focus:border-brand focus:bg-slate-800 px-2 py-1 rounded transition-all outline-none ${todo.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-300'}`}
                            />
                            <button
                                onClick={() => handleTodoDelete(todo.id)}
                                className="opacity-0 group-hover/todo:opacity-100 p-1 text-slate-500 hover:text-rose-500 transition-all rounded hover:bg-slate-800"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}

                    {/* Add new todo */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={submitNewTodo}
                            className="p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-brand"
                            title="Add task"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        <input
                            type="text"
                            placeholder="Add a new task..."
                            value={newTodoText}
                            onChange={(e) => setNewTodoText(e.target.value)}
                            onKeyDown={handleAddTodo}
                            className="flex-1 text-sm bg-transparent border-none px-2 py-1 placeholder:text-slate-500 text-slate-300 outline-none"
                        />
                    </div>
                </div>
            </div>
            {isEditing && (
                <ProjectForm
                    initialData={project}
                    onClose={() => setIsEditing(false)}
                />
            )}
        </>
    );
};

export default ProjectCard;
