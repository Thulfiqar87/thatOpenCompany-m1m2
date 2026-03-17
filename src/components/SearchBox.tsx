import { Search } from 'lucide-react';

interface SearchBoxProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const SearchBox = ({ value, onChange, placeholder = "Search...", className = "" }: SearchBoxProps) => {
    return (
        <div className={`relative ${className}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-900 border border-slate-800 text-white pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all placeholder:text-slate-500 font-medium shadow-sm"
            />
        </div>
    );
};

export default SearchBox;
