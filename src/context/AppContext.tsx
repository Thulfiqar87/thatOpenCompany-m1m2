import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Project, User } from '../types';

interface AppContextType {
    projects: Project[];
    users: User[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    addProject: (project: Project) => void;
    updateProject: (project: Project) => void;
    deleteProject: (id: string) => void;
    addUser: (user: User) => void;
    updateUser: (user: User) => void;
    deleteUser: (id: string) => void;
    importData: (importedProjects: Project[]) => void;
}

const initialProjects: Project[] = [
    {
        id: 'p1',
        name: 'Apollo Program',
        valueUSD: 25000000000,
        location: 'Houston, TX',
        date: new Date('1969-07-20').toISOString(),
        assignee: 'Neil Armstrong',
        todos: [
            { id: 't1', task: 'Build Saturn V', status: 'completed' },
            { id: 't2', task: 'Land on moon', status: 'completed' },
        ],
    },
    {
        id: 'p2',
        name: 'Mars Colony',
        valueUSD: 500000000000,
        location: 'Mars, Gale Crater',
        date: new Date('2035-01-01').toISOString(),
        assignee: 'Elon Musk',
        todos: [
            { id: 't3', task: 'Design Starship', status: 'completed' },
            { id: 't4', task: 'Launch uncrewed test', status: 'in-progress' },
            { id: 't5', task: 'Establish initial base', status: 'pending' },
        ],
    },
];

const initialUsers: User[] = [
    {
        id: 'u1',
        name: 'Neil Armstrong',
        position: 'Commander',
        dob: '05 Aug 1930',
        assignedProjectIds: ['p1'],
    },
    {
        id: 'u2',
        name: 'Elon Musk',
        position: 'CEO',
        dob: '28 Jun 1971',
        assignedProjectIds: ['p2'],
    },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    // Initialize state from local storage or fallback to default data
    const [projects, setProjects] = useState<Project[]>(() => {
        try {
            const savedProjects = localStorage.getItem('app_projects');
            return savedProjects ? JSON.parse(savedProjects) : initialProjects;
        } catch {
            return initialProjects;
        }
    });

    const [users, setUsers] = useState<User[]>(() => {
        try {
            const savedUsers = localStorage.getItem('app_users');
            return savedUsers ? JSON.parse(savedUsers) : initialUsers;
        } catch {
            return initialUsers;
        }
    });

    // Save to local storage whenever state changes
    useEffect(() => {
        if (projects !== initialProjects || localStorage.getItem('app_projects')) {
            localStorage.setItem('app_projects', JSON.stringify(projects));
        }
    }, [projects]);

    useEffect(() => {
        if (users !== initialUsers || localStorage.getItem('app_users')) {
            localStorage.setItem('app_users', JSON.stringify(users));
        }
    }, [users]);

    const addProject = (project: Project) => setProjects(prev => [...prev, project]);

    const updateProject = (updatedProject: Project) => {
        setProjects(prev =>
            prev.map(p => (p.id === updatedProject.id ? updatedProject : p))
        );
    };

    const deleteProject = (id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
    };

    const addUser = (user: User) => setUsers(prev => [...prev, user]);

    const updateUser = (updatedUser: User) => {
        setUsers(prev =>
            prev.map(u => (u.id === updatedUser.id ? updatedUser : u))
        );
    };

    const deleteUser = (id: string) => {
        setUsers(prev => prev.filter(u => u.id !== id));
    };

    const importData = (importedProjects: Project[]) => {
        setProjects(prev => {
            const merged = [...prev];
            importedProjects.forEach(ip => {
                const index = merged.findIndex(p => p.id === ip.id);
                if (index > -1) {
                    merged[index] = ip;
                } else {
                    merged.push(ip);
                }
            });
            return merged;
        });
    };

    return (
        <AppContext.Provider
            value={{
                projects,
                users,
                setProjects,
                setUsers,
                addProject,
                updateProject,
                deleteProject,
                addUser,
                updateUser,
                deleteUser,
                importData,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
