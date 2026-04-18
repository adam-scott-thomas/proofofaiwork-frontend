import { MessageSquare, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Card } from "../components/ui/card";
import { useConversations } from "../../hooks/useApi";
import { isoDate } from "../lib/poaw";

export default function Conversations() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useConversations();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-[#6B6B66]">
        Loading conversations...
      </div>
    );
  }

  const conversations = Array.isArray(data?.conversations) ? data.conversations : [];
  const filtered = conversations.filter((conversation: any) => {
    if (!query.trim()) return true;
    const haystack = [
      conversation.title,
      conversation.source_format,
      conversation.project_title,
      conversation.project_id,
      ...(conversation.model_slugs ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-8">
          <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Conversation pool</div>
          <h1 className="mt-2 text-3xl tracking-tight">Inspect parsed conversations.</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#5C5C5C]">
            This is the reader index. Open a conversation, inspect its turns, and move it into the right project.
          </p>
        </div>
      </header>

      <div className="px-8 py-8">
        <Card className="border border-[#D8D2C4] bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6B66]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, format, project, or model"
              className="w-full rounded-md border border-[#D8D2C4] bg-[#FBF8F1] px-10 py-2 text-sm outline-none"
            />
          </div>
        </Card>

        <div className="mt-4 text-[13px] text-[#6B6B66]">{filtered.length} conversations</div>

        <div className="mt-4 space-y-3">
          {filtered.map((conversation: any) => (
            <Link key={conversation.upload_id} to={`/app/conversations/${conversation.upload_id}`} className="block">
              <Card className="border border-[#D8D2C4] bg-white p-5 shadow-sm transition-colors hover:bg-[#FBF8F1]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <MessageSquare className="mt-0.5 h-4 w-4 text-[#315D8A]" />
                    <div>
                      <div className="text-[15px]">{conversation.title}</div>
                      <div className="mt-1 text-[13px] text-[#5C5C5C]">
                        {conversation.turn_count} turns • {conversation.user_turn_count} user turns • {conversation.source_format || "unknown format"}
                      </div>
                      <div className="mt-1 text-[12px] text-[#6B6B66]">
                        {(conversation.model_slugs ?? []).slice(0, 3).join(", ") || "model unknown"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[12px] text-[#6B6B66]">
                    <div>{conversation.project_id ? "assigned" : "unassigned"}</div>
                    <div className="mt-1">{isoDate(conversation.first_timestamp ? conversation.first_timestamp * 1000 : null)}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}

          {filtered.length === 0 ? (
            <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-8 text-[14px] text-[#5C5C5C] shadow-sm">
              No conversations match this search.
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
