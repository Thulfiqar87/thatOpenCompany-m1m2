import { useAppContext } from '../context/AppContext.tsx';
import UserCard from '../components/UserCard.tsx';

const UsersView = () => {
    const { users } = useAppContext();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {users.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50">
                    <h2 className="text-2xl font-bold text-slate-200 mb-2">No Users Found</h2>
                    <p className="text-slate-400 max-w-sm">Add users to start assigning them to your projects.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map(user => (
                        <UserCard key={user.id} user={user} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default UsersView;
