import { useState } from 'react';
import { Plus, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from '../../context/AppContext';
import type { ToDo, Project } from '../../types';
import ToDoCard from './ToDoCard';
import TodoForm from './TodoForm';
import SearchBox from '../SearchBox';

interface ProjectTasksListProps {
    project: Project;
}

const ProjectTasksList = ({ project }: ProjectTasksListProps) => {
    const { updateProject } = useAppContext();
    const [searchQuery, setSearchQuery] = useState('');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTodo, setEditingTodo] = useState<ToDo | undefined>(undefined);

    const todos = [...project.todos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleDeleteTodo = (todoId: string) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        const updatedTodos = project.todos.filter(t => t.id !== todoId);
        updateProject({ ...project, todos: updatedTodos });
    };

    const handleEditClick = (todo: ToDo) => {
        setEditingTodo(todo);
        setIsFormOpen(true);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Tasks & ToDos', 14, 22);

        doc.setFontSize(12);
        doc.setTextColor(40);
        doc.text(`Project: ${project.name}`, 14, 32);

        doc.setFontSize(10);
        doc.setTextColor(100);
        const detailsText = `Value: $${project.valueUSD.toLocaleString()}  |  Location: ${project.location || 'N/A'}  |  Owner: ${project.assignee || 'Unassigned'}`;
        doc.text(detailsText, 14, 38);

        const tableColumn = ["Task", "Assignee", "Status", "Priority", "Date"];
        const tableRows: (string | number)[][] = [];

        // Sort todos consistently if needed, or use them as they are displayed
        todos.forEach(todo => {
            const taskData = [
                todo.task,
                todo.assignee || 'Unassigned',
                todo.status,
                todo.priority,
                new Date(todo.createdAt).toLocaleDateString()
            ];
            tableRows.push(taskData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 44,
        });

        const safeProjectName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`${safeProjectName}_tasks.pdf`);
    };

    const handleAddNewClick = () => {
        setEditingTodo(undefined);
        setIsFormOpen(true);
    };

    const handleSaveSuccess = (savedTodo: ToDo) => {
        const index = project.todos.findIndex(t => t.id === savedTodo.id);
        const newTodos = [...project.todos];

        if (index >= 0) {
            newTodos[index] = savedTodo;
        } else {
            newTodos.push(savedTodo);
        }

        updateProject({ ...project, todos: newTodos });
        setIsFormOpen(false);
    };

    const filteredTodos = todos.filter(todo =>
        todo.task.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                    Tasks & ToDos
                    <span className="ml-3 text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-full font-bold">
                        {todos.length}
                    </span>
                </h2>

                <div className="flex w-full sm:w-auto gap-3">
                    <SearchBox
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search tasks..."
                        className="w-full sm:w-64"
                    />
                    <button
                        onClick={handleExportPDF}
                        disabled={todos.length === 0}
                        className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 px-4 py-2 rounded-xl text-sm font-semibold flex items-center transition-colors shrink-0 border border-slate-700"
                        title="Export tasks as PDF"
                    >
                        <Download className="w-4 h-4 mr-1.5" /> Export PDF
                    </button>
                    <button
                        onClick={handleAddNewClick}
                        className="bg-brand hover:bg-brand-light text-slate-950 px-4 py-2 rounded-xl text-sm font-semibold flex items-center transition-colors shrink-0 shadow-sm shadow-brand/20"
                    >
                        <Plus className="w-4 h-4 mr-1.5" /> New Task
                    </button>
                </div>
            </div>

            {filteredTodos.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl text-slate-500">
                    {searchQuery ? 'No tasks match your search.' : 'No tasks found for this project. Create one to get started!'}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTodos.map(todo => (
                        <ToDoCard
                            key={todo.id}
                            todo={todo}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteTodo}
                        />
                    ))}
                </div>
            )}

            {isFormOpen && (
                <TodoForm
                    projectId={project.id}
                    initialData={editingTodo}
                    onClose={() => setIsFormOpen(false)}
                    onSaveSuccess={handleSaveSuccess}
                />
            )}
        </div>
    );
};

export default ProjectTasksList;
