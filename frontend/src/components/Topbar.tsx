import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Moon, Sun, X } from "lucide-react";
import { api } from "../api/client";
import { Asset } from "../types";
import { useTheme } from "../context/ThemeContext";

export function Topbar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Asset[]>([]);
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      api.search.global(query).then((r) => {
        setResults(r.results);
        setOpen(true);
      }).catch(() => {});
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="h-16 border-b border-borderc bg-surface/60 backdrop-blur sticky top-0 z-30 flex items-center gap-4 px-6">
      <div ref={boxRef} className="relative flex-1 max-w-xl">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-signal-idle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search any server, VM, database or application…"
            className="w-full bg-surface-raised border border-borderc rounded-lg pl-9 pr-8 py-2 text-sm placeholder:text-signal-idle focus-ring focus:border-brand/50"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-signal-idle hover:text-base-100">
              <X size={14} />
            </button>
          )}
        </div>

        {open && results.length > 0 && (
          <div className="absolute mt-1.5 w-full panel-raised shadow-card max-h-96 overflow-y-auto z-40 animate-fade-up">
            {results.map((a) => (
              <button
                key={a.id}
                onClick={() => { navigate(`/assets/${a.id}`); setOpen(false); setQuery(""); }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-surface-hover flex items-center justify-between gap-3 border-b border-borderc last:border-0"
              >
                <div className="min-w-0">
                  <div className="font-mono text-sm font-medium truncate">{a.name}</div>
                  <div className="text-xs text-signal-idle truncate">
                    {a.application_name} → {a.platform_name} → {a.policy_name}
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wide text-signal-idle shrink-0">{a.asset_type}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={toggle}
        className="w-9 h-9 rounded-lg border border-borderc bg-surface-raised flex items-center justify-center text-signal-idle hover:text-base-100 hover:border-brand/40 transition-colors focus-ring"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      <div className="flex items-center gap-2.5 pl-3 border-l border-borderc">
        <div className="w-8 h-8 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center text-brand text-xs font-semibold">
          OP
        </div>
        <div className="leading-tight hidden sm:block">
          <div className="text-sm font-medium">Ops Team</div>
          <div className="text-[11px] text-signal-idle">Backup Admin</div>
        </div>
      </div>
    </header>
  );
}
