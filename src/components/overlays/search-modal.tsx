"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Check, User as UserIcon } from "lucide-react";
import { useAppStore } from "@/features/app/store/app-store";
import { useSearch } from "@/features/search/hooks";
import { cn } from "@/lib/utils";

export function SearchModal() {
  const searchOpen = useAppStore((s) => s.searchOpen);
  const openSearch = useAppStore((s) => s.openSearch);
  const closeSearch = useAppStore((s) => s.closeSearch);
  const openTaskDetail = useAppStore((s) => s.openTaskDetail);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useSearch(debounced);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
      }
      if (e.key === "Escape") closeSearch();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openSearch, closeSearch]);

  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setDebounced("");
    }
  }, [searchOpen]);

  const q = query.trim();
  const hasResults =
    !!data && (data.tasks.length || data.projects.length || data.labels.length || data.people.length || data.comments.length || data.files.length);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[100] flex items-start justify-center bg-navy/40 pt-[12vh] opacity-0 transition-opacity",
        searchOpen && "pointer-events-auto opacity-100"
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSearch();
      }}
    >
      <div
        className={cn(
          "w-[560px] max-w-[92vw] -translate-y-2 overflow-hidden rounded-lg bg-surface shadow-lg transition-transform",
          searchOpen && "translate-y-0"
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
          <Search className="h-[17px] w-[17px] text-text-secondary" />
          <input
            autoFocus={searchOpen}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, projects, labels, people…"
            className="flex-1 border-none bg-transparent text-[15px] text-text outline-none"
          />
          <kbd className="rounded-[5px] border border-border px-1.5 py-0.5 text-[11px] text-text-faint">Esc</kbd>
        </div>
        <div className="scrollbar-thin max-h-[50vh] overflow-y-auto p-2">
          {!q && (
            <div className="p-4 text-xs text-text-secondary">
              Search across tasks, projects, labels and people. Try &quot;design&quot; or &quot;API&quot;.
            </div>
          )}
          {q && isFetching && !data && <div className="p-4 text-xs text-text-secondary">Searching…</div>}
          {q && data && !hasResults && <div className="p-4 text-xs text-text-secondary">No results for &quot;{query}&quot;.</div>}

          {!!data?.tasks.length && (
            <ResultGroup label={`TASKS (${data.tasks.length})`}>
              {data.tasks.map((t) => (
                <Result
                  key={t.id}
                  icon={<Check className="h-3.5 w-3.5" />}
                  label={t.title}
                  onClick={() => {
                    openTaskDetail(t.id);
                    closeSearch();
                  }}
                />
              ))}
            </ResultGroup>
          )}
          {!!data?.projects.length && (
            <ResultGroup label={`PROJECTS (${data.projects.length})`}>
              {data.projects.map((p) => (
                <Result
                  key={p.id}
                  icon={<span className="h-[9px] w-[9px] rounded-full" style={{ background: p.color ?? "#94A3B8" }} />}
                  label={p.name}
                  onClick={() => {
                    router.push(`/projects/${p.id}`);
                    closeSearch();
                  }}
                />
              ))}
            </ResultGroup>
          )}
          {!!data?.labels.length && (
            <ResultGroup label={`LABELS (${data.labels.length})`}>
              {data.labels.map((l) => (
                <Result
                  key={l.id}
                  icon={<span className="h-3 w-3 rounded-full" style={{ background: l.color ?? "#315CFF" }} />}
                  label={`#${l.name}`}
                  onClick={() => {
                    router.push("/filters");
                    closeSearch();
                  }}
                />
              ))}
            </ResultGroup>
          )}
          {!!data?.people.length && (
            <ResultGroup label={`PEOPLE (${data.people.length})`}>
              {data.people.map((p) => (
                <Result key={p.id} icon={<UserIcon className="h-3.5 w-3.5" />} label={p.fullName} onClick={closeSearch} />
              ))}
            </ResultGroup>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div className="px-2.5 pb-0.5 pt-1.5 text-[11px] font-bold tracking-wide text-text-faint">{label}</div>
      {children}
    </>
  );
}

function Result({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13.5px] text-text hover:bg-bg"
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
