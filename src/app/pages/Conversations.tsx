import { MessageSquare, Search, FolderKanban } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Link } from "react-router";
import { useState } from "react";
import { useConversations, usePool } from "../../hooks/useApi";

export default function Conversations() {
  const [viewMode, setViewMode] = useState<"raw" | "organized">("raw");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: convsData, isLoading: convsLoading } = useConversations();
  const { data: poolData, isLoading: poolLoading } = usePool();

  const isLoading = convsLoading || poolLoading;

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center text-[13px] text-[#717182]">Loading...</div>
  );

  // Parsed conversations (have turn_count > 0, proper metadata)
  const parsedConvs: any[] = Array.isArray(convsData)
    ? convsData
    : convsData?.conversations ?? convsData?.data ?? convsData?.items ?? [];

  // Pool items (uploaded but not yet parsed) — include these too so users see everything they uploaded
  const poolConvs: any[] = poolData?.conversations ?? [];

  // Merge and dedupe by upload_id / id
  const seenIds = new Set<string>();
  const conversations: any[] = [];
  for (const c of [...parsedConvs, ...poolConvs]) {
    const key = c.upload_id ?? c.id ?? c.file_name;
    if (key && !seenIds.has(key)) {
      seenIds.add(key);
      conversations.push({ ...c, id: c.upload_id ?? c.id });
    }
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredConversations = normalizedQuery
    ? conversations.filter((conversation: any) => {
        const haystack = [
          conversation.title,
          conversation.filename,
          conversation.preview,
          conversation.model,
          conversation.project,
          conversation.project_id,
          ...(Array.isArray(conversation.tags) ? conversation.tags : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : conversations;

  // Group conversations by project for AI Organized view
  const groupedByProject = filteredConversations.reduce((acc: Record<string, any[]>, conv: any) => {
    const project = conv.project_id ?? conv.project ?? "Unassigned";
    if (!acc[project]) acc[project] = [];
    acc[project].push(conv);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl tracking-tight">Conversations</h1>
              <p className="mt-1 text-[13px] text-[#717182]">
                {viewMode === "raw"
                  ? "Chronological list of all conversations"
                  : "Conversations organized by AI-detected work streams"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center gap-2 rounded-md border border-[rgba(0,0,0,0.08)] bg-white p-1">
                <Button
                  variant={viewMode === "raw" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("raw")}
                  className="h-8"
                >
                  Raw Conversations
                </Button>
                <Button
                  variant={viewMode === "organized" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("organized")}
                  className="h-8"
                >
                  AI Organized
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Search Bar */}
        <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#717182]" />
            <Input
              placeholder="Search conversations by content, tags, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-none bg-transparent focus-visible:ring-0"
            />
          </div>
        </Card>

        {/* Results Count */}
        <div className="mb-4 text-[13px] text-[#717182]">
          {viewMode === "raw"
            ? `${filteredConversations.length} conversations found`
            : `${Object.keys(groupedByProject).length} projects • ${filteredConversations.length} conversations`}
        </div>

        {/* Raw View - Chronological list */}
        {viewMode === "raw" && (
          filteredConversations.length === 0 ? (
            <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-8 text-center shadow-sm">
              <p className="text-[13px] text-[#717182]">No conversations yet.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conversation: any) => (
                <Link key={conversation.id} to={`/app/conversations/${conversation.id}`}>
                  <Card className="border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] p-4 shadow-none hover:bg-white hover:border-[rgba(0,0,0,0.12)] transition-all">
                    <div className="flex gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white flex-shrink-0">
                        <MessageSquare className="h-4 w-4 text-[#C0C0C5]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex items-start justify-between gap-4">
                          <h3 className="text-[14px] text-[#717182] line-clamp-1">
                            {conversation.title ?? conversation.filename ?? conversation.id}
                          </h3>
                          <div className="text-[12px] text-[#C0C0C5] whitespace-nowrap font-mono">
                            {new Date(conversation.created_at ?? Date.now()).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                        {conversation.preview && (
                          <p className="mb-2 text-[13px] text-[#C0C0C5] line-clamp-1">
                            {conversation.preview}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[12px] text-[#C0C0C5]">
                          {conversation.model && <span>{conversation.model}</span>}
                          {conversation.model && conversation.turn_count != null && <span>•</span>}
                          {conversation.turn_count != null && <span>{conversation.turn_count} turns</span>}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )
        )}

        {/* AI Organized View - Grouped by project */}
        {viewMode === "organized" && (
          Object.keys(groupedByProject).length === 0 ? (
            <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-8 text-center shadow-sm">
              <p className="text-[13px] text-[#717182]">No conversations to organize.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByProject).map(([project, projectConvs]) => (
                <div key={project}>
                  <div className="mb-3 flex items-center gap-2">
                    <FolderKanban className="h-4 w-4" style={{ color: 'var(--score-execution)' }} />
                    <h3 className="text-[15px]">{project}</h3>
                    <span className="text-[13px] text-[#717182]">
                      → {projectConvs.length} conversation{projectConvs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {projectConvs.map((conversation: any) => (
                      <Link key={conversation.id} to={`/app/conversations/${conversation.id}`}>
                        <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-4 shadow-sm hover:shadow-md transition-all">
                          <div className="flex gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#F5F5F7] flex-shrink-0">
                              <MessageSquare className="h-4 w-4 text-[#717182]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="mb-1 flex items-start justify-between gap-4">
                                <h3 className="text-[14px] line-clamp-1">
                                  {conversation.title ?? conversation.filename ?? conversation.id}
                                </h3>
                                <div className="text-[12px] text-[#717182] whitespace-nowrap font-mono">
                                  {new Date(conversation.created_at ?? Date.now()).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </div>
                              </div>
                              {conversation.preview && (
                                <p className="mb-2 text-[13px] text-[#717182] line-clamp-1">
                                  {conversation.preview}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-[12px] text-[#717182]">
                                {conversation.model && <span>{conversation.model}</span>}
                                {conversation.model && conversation.turn_count != null && <span>•</span>}
                                {conversation.turn_count != null && <span>{conversation.turn_count} turns</span>}
                                {Array.isArray(conversation.tags) && conversation.tags.length > 0 && (
                                  <div className="ml-auto flex items-center gap-1.5">
                                    {conversation.tags.slice(0, 2).map((tag: string) => (
                                      <Badge
                                        key={tag}
                                        variant="outline"
                                        className="border-[rgba(0,0,0,0.08)] bg-white text-[11px] font-mono"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
