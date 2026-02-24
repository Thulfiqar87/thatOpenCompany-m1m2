export type TodoStatus = 'pending' | 'in-progress' | 'completed';

export interface ToDo {
    id: string;
    task: string;
    status: TodoStatus;
}

export interface Project {
    id: string;
    name: string;
    valueUSD: number;
    location: string;
    date: string; // ISO string
    assignee: string;
    todos: ToDo[];
}

export interface User {
    id: string;
    name: string;
    position: string;
    dob: string; // DD MMM YYYY
    assignedProjectIds: string[]; // Links to Project IDs
    photoUrl?: string;
    linkedInUrl?: string;
}
