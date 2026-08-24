import { Search } from "lucide-react";
import { cn } from "../../utils/cn";

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar…",
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-steel-700/60 bg-abyss-900/60 pl-9 pr-3 text-sm text-steel-100 placeholder:text-steel-500 focus:border-gold-500/60 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
      />
    </div>
  );
}
