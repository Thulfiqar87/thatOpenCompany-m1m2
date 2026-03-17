import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { doc, setDoc, deleteDoc, writeBatch, collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';
import type { Project, User } from '../types';

interface AppContextType {
    projects: Project[];
    users: User[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    addProject: (project: Project) => Promise<void>;
    updateProject: (project: Project) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    addUser: (user: User) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    importData: (importedProjects: Project[]) => Promise<void>;
    isLoading: boolean;
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
            { id: 't1', projectId: 'p1', task: 'Build Saturn V', status: 'completed', priority: 'high', createdAt: '1969-07-10T10:00:00Z' },
            { id: 't2', projectId: 'p1', task: 'Land on moon', status: 'completed', priority: 'high', createdAt: '1969-07-15T12:00:00Z' },
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
            { id: 't3', projectId: 'p2', task: 'Design Starship', status: 'completed', priority: 'high', createdAt: '2034-01-01T10:00:00Z' },
            { id: 't4', projectId: 'p2', task: 'Launch uncrewed test', status: 'in-progress', priority: 'medium', createdAt: '2034-06-01T12:00:00Z' },
            { id: 't5', projectId: 'p2', task: 'Establish initial base', status: 'pending', priority: 'low', createdAt: '2034-12-01T14:00:00Z' },
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

    const [isLoading, setIsLoading] = useState(true);

    // Initial Fetch from Firestore
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch Projects
                const projectsSnap = await getDocs(query(collection(db, 'projects')));
                const fetchedProjects: Project[] = [];
                projectsSnap.forEach(doc => {
                    fetchedProjects.push(doc.data() as Project);
                });

                if (fetchedProjects.length > 0) {
                    setProjects(fetchedProjects);
                }

                // Fetch Users
                const usersSnap = await getDocs(query(collection(db, 'users')));
                const fetchedUsers: User[] = [];
                usersSnap.forEach(doc => {
                    fetchedUsers.push(doc.data() as User);
                });

                if (fetchedUsers.length > 0) {
                    setUsers(fetchedUsers);
                }
            } catch (error) {
                console.error('Error fetching data from Firestore:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Save to local storage whenever state changes
    useEffect(() => {
        localStorage.setItem('app_projects', JSON.stringify(projects));
    }, [projects]);

    useEffect(() => {
        localStorage.setItem('app_users', JSON.stringify(users));
    }, [users]);

    const addProject = async (project: Project) => {
        setProjects(prev => [...prev, project]);
        // Sync to Firestore
        try {
            await setDoc(doc(db, 'projects', project.id), project);
        } catch (error) {
            console.error('Error syncing new project to Firestore:', error);
        }
    };

    const updateProject = async (updatedProject: Project) => {
        setProjects(prev =>
            prev.map(p => (p.id === updatedProject.id ? updatedProject : p))
        );
        // Sync to Firestore
        try {
            await setDoc(doc(db, 'projects', updatedProject.id), updatedProject, { merge: true });
        } catch (error) {
            console.error('Error syncing updated project to Firestore:', error);
        }
    };

    const deleteProject = async (id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
        // Sync to Firestore
        try {
            await deleteDoc(doc(db, 'projects', id));
        } catch (error) {
            console.error('Error deleting project from Firestore:', error);
        }
    };

    const addUser = async (user: User) => {
        setUsers(prev => [...prev, user]);
        // Sync to Firestore
        try {
            await setDoc(doc(db, 'users', user.id), user);
        } catch (error) {
            console.error('Error syncing new user to Firestore:', error);
        }
    };

    const updateUser = async (updatedUser: User) => {
        setUsers(prev =>
            prev.map(u => (u.id === updatedUser.id ? updatedUser : u))
        );
        // Sync to Firestore
        try {
            await setDoc(doc(db, 'users', updatedUser.id), updatedUser, { merge: true });
        } catch (error) {
            console.error('Error syncing updated user to Firestore:', error);
        }
    };

    const deleteUser = async (id: string) => {
        setUsers(prev => prev.filter(u => u.id !== id));
        // Sync to Firestore
        try {
            await deleteDoc(doc(db, 'users', id));
        } catch (error) {
            console.error('Error deleting user from Firestore:', error);
        }
    };

    const importData = async (importedProjects: Project[]) => {
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

        // Sync all to Firestore (using batch for efficiency)
        try {
            const batch = writeBatch(db);
            importedProjects.forEach(p => {
                batch.set(doc(db, 'projects', p.id), p);
            });
            await batch.commit();
        } catch (error) {
            console.error('Error syncing imported data to Firestore:', error);
        }
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
                isLoading,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
