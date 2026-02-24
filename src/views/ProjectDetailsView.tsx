import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Edit3, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useAppContext } from '../context/AppContext.tsx';
import type { TodoStatus, ToDo, Project } from '../types/index.ts';
import { getInitials, formatDate, getRandomAvatarColor } from '../utils/helpers.ts';
import clsx from 'clsx';

const ProjectDetailsView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { projects, updateProject, users } = useAppContext();

    const project = projects.find(p => p.id === id);
    const bgColor = useMemo(() => getRandomAvatarColor(), []);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Project | null>(project || null);

    const [newTodoTask, setNewTodoTask] = useState('');
    const [newTodoStatus, setNewTodoStatus] = useState<TodoStatus>('pending');

    if (!project || !editForm) {
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

    // Handle Edit Project Form Change
    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditForm(prev => prev ? { ...prev, [name]: value } : prev);
    };

    // Handle Save Project Edits
    const handleSaveEdits = () => {
        if (editForm.name.trim().length < 5) {
            alert('Project name must be at least 5 characters long.');
            return;
        }
        updateProject({
            ...editForm,
            valueUSD: Number(editForm.valueUSD)
        });
        setIsEditing(false);
    };

    // Handle ToDo Status Change
    const handleStatusChange = (todoId: string, newStatus: TodoStatus) => {
        const updatedTodos = project.todos.map(t =>
            t.id === todoId ? { ...t, status: newStatus } : t
        );
        updateProject({ ...project, todos: updatedTodos });
    };

    // Handle ToDo Text Change
    const handleTaskNameChange = (todoId: string, newName: string) => {
        const updatedTodos = project.todos.map(t =>
            t.id === todoId ? { ...t, task: newName } : t
        );
        updateProject({ ...project, todos: updatedTodos });
    };

    // Handle Add ToDo
    const handleAddTodo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodoTask.trim()) return;

        const newTodo: ToDo = {
            id: uuidv4(),
            task: newTodoTask.trim(),
            status: newTodoStatus
        };

        updateProject({
            ...project,
            todos: [...project.todos, newTodo]
        });

        setNewTodoTask('');
        setNewTodoStatus('pending');
    };

    // Handle Delete ToDo
    const handleDeleteTodo = (todoId: string) => {
        const updatedTodos = project.todos.filter(t => t.id !== todoId);
        updateProject({ ...project, todos: updatedTodos });
    };

    // Status Styling Logic
    const getStatusStyles = (status: TodoStatus) => {
        switch (status) {
            case 'completed':
                return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
            case 'in-progress':
                return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
            case 'pending':
            default:
                return 'bg-slate-800/50 border-slate-700 text-slate-300';
        }
    };

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
                {/* Decorative background blur */}
                <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-10 blur-3xl ${bgColor}`} />

                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-5">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl ${bgColor} shadow-lg shrink-0 border border-slate-700`}>
                            <span className="uppercase">{getInitials(project.name)}</span>
                        </div>
                        <div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditChange}
                                    className="text-3xl font-bold text-white bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 mb-2 focus:ring-2 focus:ring-brand focus:border-brand outline-none w-full"
                                />
                            ) : (
                                <h1 className="text-3xl font-bold text-white tracking-tight">{project.name}</h1>
                            )}
                            <div className="text-sm font-medium text-slate-400 mt-2 flex items-center gap-4">
                                <span>Value: </span>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        name="valueUSD"
                                        value={editForm.valueUSD}
                                        onChange={handleEditChange}
                                        className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1 focus:ring-2 focus:ring-brand w-32"
                                    />
                                ) : (
                                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold leading-none inline-flex items-center">
                                        ${project.valueUSD.toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        {isEditing ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditForm(project);
                                    }}
                                    className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleSaveEdits}
                                    className="flex items-center px-4 py-2.5 bg-brand text-slate-950 text-sm font-semibold rounded-xl hover:bg-brand-light transition-colors shadow-sm shadow-brand/20"
                                >
                                    <Save className="w-4 h-4 mr-2" /> Save Edits
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-colors shadow-sm"
                            >
                                <Edit3 className="w-4 h-4 mr-2" /> Edit Project
                            </button>
                        )}
                    </div>
                </div>

                {/* Project Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-800">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Location</p>
                        {isEditing ? (
                            <input
                                type="text"
                                name="location"
                                value={editForm.location}
                                onChange={handleEditChange}
                                className="w-full text-sm bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand"
                            />
                        ) : (
                            <p className="font-medium text-slate-300">{project.location || 'N/A'}</p>
                        )}
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</p>
                        {isEditing ? (
                            <input
                                type="date"
                                name="date"
                                value={editForm.date.split('T')[0]} // Quick formatting for date input
                                onChange={(e) => {
                                    const dateVal = e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString();
                                    setEditForm(prev => prev ? { ...prev, date: dateVal } : prev);
                                }}
                                className="w-full text-sm bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand [color-scheme:dark]"
                            />
                        ) : (
                            <p className="font-medium text-slate-300">{formatDate(project.date)}</p>
                        )}
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Assignee</p>
                        {isEditing ? (
                            <select
                                name="assignee"
                                value={editForm.assignee}
                                onChange={(e) => handleEditChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
                                className="w-full text-sm bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand cursor-pointer"
                            >
                                <option value="">Unassigned</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.name}>
                                        {user.name} ({user.position})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p className="font-medium text-slate-300">{project.assignee || 'Unassigned'}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ToDos Section */}
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                Tasks & ToDos
                <span className="ml-3 text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-full font-bold">
                    {project.todos.length}
                </span>
            </h2>

            {/* Add ToDo Form */}
            <form onSubmit={handleAddTodo} className="flex gap-4 mb-8 bg-slate-900 p-2 border border-slate-800 rounded-2xl shadow-sm">
                <input
                    type="text"
                    value={newTodoTask}
                    onChange={(e) => setNewTodoTask(e.target.value)}
                    placeholder="What needs to be done?"
                    className="flex-1 bg-transparent px-4 py-2 outline-none text-white placeholder:text-slate-500 font-medium"
                />
                <select
                    value={newTodoStatus}
                    onChange={(e) => setNewTodoStatus(e.target.value as TodoStatus)}
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-brand font-medium cursor-pointer"
                >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
                <button
                    type="submit"
                    disabled={!newTodoTask.trim()}
                    className="bg-brand hover:bg-brand-light disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center transition-colors"
                >
                    <Plus className="w-5 h-5 mr-1" /> Add
                </button>
            </form>

            {/* ToDos List */}
            <div className="space-y-3">
                {project.todos.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl text-slate-500">
                        No tasks found for this project.
                    </div>
                ) : (
                    project.todos.map(todo => (
                        <div
                            key={todo.id}
                            className={clsx(
                                "flex items-center justify-between p-4 rounded-2xl border transition-colors group",
                                getStatusStyles(todo.status)
                            )}
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <div className={clsx(
                                    "w-3 h-3 rounded-full shrink-0 shadow-sm border border-slate-900/50",
                                    todo.status === 'completed' ? 'bg-emerald-500' :
                                        todo.status === 'in-progress' ? 'bg-amber-500' : 'bg-slate-500'
                                )} />
                                <div className={clsx(
                                    "font-medium flex-1",
                                    todo.status === 'completed' && "line-through opacity-50"
                                )}>
                                    <input
                                        type="text"
                                        value={todo.task}
                                        onChange={(e) => handleTaskNameChange(todo.id, e.target.value)}
                                        className="w-full bg-transparent border border-transparent hover:border-slate-700 focus:border-brand focus:bg-slate-900 px-2 py-1 rounded transition-all outline-none text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <select
                                    value={todo.status}
                                    onChange={(e) => handleStatusChange(todo.id, e.target.value as TodoStatus)}
                                    className="bg-slate-900/60 border border-slate-700/50 backdrop-blur-sm text-slate-300 text-sm rounded-lg px-3 py-1.5 outline-none font-medium cursor-pointer focus:ring-1 focus:ring-brand"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>

                                <button
                                    onClick={() => handleDeleteTodo(todo.id)}
                                    className="p-2 text-slate-500 hover:text-rose-500 hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Delete Task"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProjectDetailsView;
