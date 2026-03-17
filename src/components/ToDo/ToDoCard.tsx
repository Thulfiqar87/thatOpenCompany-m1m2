import { Trash2, Edit3, User } from 'lucide-react';
import clsx from 'clsx';
import type { ToDo } from '../../types';

interface ToDoCardProps {
    todo: ToDo;
    onEdit: (todo: ToDo) => void;
    onDelete: (todoId: string) => void;
}

const getStatusStyles = (status: ToDo['status']) => {
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

const getStatusIndicatorColor = (status: ToDo['status']) => {
    switch (status) {
        case 'completed': return 'bg-emerald-500';
        case 'in-progress': return 'bg-amber-500';
        case 'pending':
        default: return 'bg-slate-500';
    }
};

const getPriorityBadgeStyles = (priority: ToDo['priority']) => {
    switch (priority) {
        case 'high':
            return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
        case 'medium':
            return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
        case 'low':
        default:
            return 'bg-slate-700/50 border-slate-600 text-slate-300';
    }
};

const ToDoCard = ({ todo, onEdit, onDelete }: ToDoCardProps) => {
    return (
        <div className={clsx(
            "flex items-center justify-between p-4 rounded-2xl border transition-colors group",
            getStatusStyles(todo.status)
        )}>
            <div className="flex items-center gap-4 flex-1">
                <div className={clsx(
                    "w-3 h-3 rounded-full shrink-0 shadow-sm border border-slate-900/50",
                    getStatusIndicatorColor(todo.status)
                )} />
                <div className={clsx(
                    "font-medium",
                    todo.status === 'completed' && "line-through opacity-50"
                )}>
                    <div>{todo.task}</div>
                    {todo.assignee && (
                        <div className="flex items-center text-xs text-slate-500 mt-1 font-normal">
                            <User className="w-3 h-3 mr-1" />
                            {todo.assignee}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <span className={clsx(
                    "px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider",
                    getPriorityBadgeStyles(todo.priority)
                )}>
                    {todo.priority}
                </span>

                <span className="capitalize text-xs font-semibold px-3 py-1 bg-slate-900/40 rounded-lg">
                    {todo.status.replace('-', ' ')}
                </span>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(todo)}
                        className="p-2 text-slate-400 hover:text-brand hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Task"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(todo.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete Task"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ToDoCard;
