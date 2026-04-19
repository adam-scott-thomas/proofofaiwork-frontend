import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ArrowRight,
  FileBarChart,
  FolderKanban,
  Globe,
  Loader2,
  MessagesSquare,
  Search as SearchIcon,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useGlobalSearch } from "../../hooks/useApi";
import { dateTime } from "../lib/poaw";

type SearchResult = {
  type: "project" | "conversation" | "proof_page" | string;
  id: string;
  title: string;
  description?: string | null;
  status?: string;
  source_format?: string;
  turn_count?: number;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type FilterKey = "all" | "projects" | "conversations" | "proofs";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const [debounced, setDebounced] = useState(initial);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debounced) {
      setSearchParams({ q: debounced }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [debounced, setSearchParams]);

  const { data, isLoading } = useGlobalSearch(debounced);

  const results: SearchResult[] = Array.isArray(data?.results) ? data.results : [];

  const buckets = useMemo(() => {
    const projects: SearchResult[] = [];
    const conversations: SearchResult[] = [];
    const proofs: SearchResult[] = [];
    for (const result of results) {
      if (result.type === "project") projects.push(result);
      else if (result.type === "conversation") conversations.push(result);
      else if (result.type === "proof_page") proofs.push(result);
    }
    return { projects, conversations, proofs };
  }, [results]);

  const visible = useMemo(() => {
    if (filter === "projects") return buckets.projects;
    if (filter === "conversations") return buckets.conversations;
    if (filter === "proofs") return buckets.proofs;
    return results;
  }, [filter, results, buckets]);

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-7">
          <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Search</div>
          <h1 className="mt-2 text-3xl tracking-tight">Find anything across your workspace.</h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#5C5C5C]">
            Searches project titles / descriptions, conversation titles, and proof page headlines.
          </p>

          <div className="relative mt-5 max-w-xl">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6B66]" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by keyword..."
              className="h-11 pl-9 text-[14px]"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(["all", "projects", "conversations", "proofs"] as FilterKey[]).map((key) => {
              const count =
                key === "all" ? results.length :
                key === "projects" ? buckets.projects.length :
                key === "conversations" ? buckets.conversations.length :
                buckets.proofs.length;
              const active = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] transition-colors ${
                    active
                      ? "border-[#315D8A] bg-[#EEF2F9] text-[#161616]"
                      : "border-[#D8D2C4] bg-white text-[#5C5C5C] hover:bg-[#FBF8F1]"
                  }`}
                >
                  <span className="capitalize">{key}</span>
                  <span className="rounded-full bg-[#F3EEE2] px-1.5 py-0.5 text-[10px] text-[#6B6B66]">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-4xl">
          {debounced.length < 2 ? (
            <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-10 text-center text-[13px] text-[#5C5C5C]">
              Type at least 2 characters to search.
            </Card>
          ) : isLoading ? (
            <div className="flex items-center gap-2 p-8 text-[13px] text-[#6B6B66]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching "{debounced}"...
            </div>
          ) : visible.length === 0 ? (
            <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-10 text-center text-[13px] text-[#5C5C5C]">
              No results for <span className="text-[#161616]">"{debounced}"</span>
              {filter !== "all" ? <span> in {filter}.</span> : "."}
            </Card>
          ) : (
            <div className="space-y-2">
              {visible.map((result) => (
                <ResultRow key={`${result.type}-${result.id}`} result={result} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultRow({ result }: { result: SearchResult }) {
  const meta = typeMeta(result.type);
  const href = result.type === "project" ? `/app/projects/${result.id}`
    : result.type === "conversation" ? `/app/conversations/${result.id}`
    : result.type === "proof_page" ? `/app/proof-pages`
    : null;

  if (!href) return null;
  const Icon = meta.icon;

  return (
    <Link to={href}>
      <Card className="group border border-[#D8D2C4] bg-white p-4 transition-colors hover:border-[#A88F5F] hover:bg-[#FBF8F1]">
        <div className="flex items-start gap-3">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.color}`} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#D8D2C4] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#6B6B66]">
                {meta.label}
              </span>
              {result.status ? (
                <span className="text-[10px] uppercase tracking-[0.08em] text-[#6B6B66]">{result.status}</span>
              ) : null}
            </div>
            <div className="mt-1 truncate text-[14px] text-[#161616] group-hover:text-[#315D8A]">{result.title}</div>
            {result.description ? (
              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#6B6B66]">{result.description}</p>
            ) : null}
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#6B6B66]">
              {result.source_format ? <span>{result.source_format}</span> : null}
              {result.turn_count != null ? <span>{result.turn_count} turns</span> : null}
              {result.published_at ? <span>published {dateTime(result.published_at)}</span> : null}
              {result.updated_at ? <span>updated {dateTime(result.updated_at)}</span> : null}
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#6B6B66] opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </Card>
    </Link>
  );
}

function typeMeta(type: string) {
  switch (type) {
    case "project":
      return { label: "Project", icon: FolderKanban, color: "text-[#315D8A]" };
    case "conversation":
      return { label: "Conversation", icon: MessagesSquare, color: "text-[#315D8A]" };
    case "proof_page":
      return { label: "Proof page", icon: Globe, color: "text-[#2F6B3B]" };
    default:
      return { label: type, icon: FileBarChart, color: "text-[#6B6B66]" };
  }
}
