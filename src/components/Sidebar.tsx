import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users } from 'lucide-react';
import clsx from 'clsx';

import logoSrc from '../assets/company logo.svg';

const Sidebar = () => {
    return (
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-slate-900 border-r border-slate-800 flex flex-col z-10 transition-all shadow-2xl shadow-slate-950/50">
            {/* Logo */}
            <div className="p-6">
                <div className="h-16 w-full flex items-center justify-center">
                    <img src={logoSrc} alt="App Logo" className="h-full object-contain" />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 mt-4">
                <NavLink
                    to="/projects"
                    className={({ isActive }) =>
                        clsx(
                            'flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group',
                            isActive
                                ? 'bg-brand/10 text-brand'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        )
                    }
                >
                    {({ isActive }) => (
                        <>
                            <LayoutDashboard
                                className={clsx(
                                    'w-5 h-5 transition-colors',
                                    isActive ? 'text-brand' : 'text-slate-500 group-hover:text-white'
                                )}
                            />
                            <span>Projects</span>
                        </>
                    )}
                </NavLink>

                <NavLink
                    to="/users"
                    className={({ isActive }) =>
                        clsx(
                            'flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group',
                            isActive
                                ? 'bg-brand/10 text-brand'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        )
                    }
                >
                    {({ isActive }) => (
                        <>
                            <Users
                                className={clsx(
                                    'w-5 h-5 transition-colors',
                                    isActive ? 'text-brand' : 'text-slate-500 group-hover:text-white'
                                )}
                            />
                            <span>Users</span>
                        </>
                    )}
                </NavLink>
            </nav>

            {/* Footer / Version Info */}
            <div className="p-6 border-t border-slate-800">
                <div className="text-sm text-slate-500 font-medium">v1.0.0</div>
            </div>
        </aside>
    );
};

export default Sidebar;
