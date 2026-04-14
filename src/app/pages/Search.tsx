import { Search as SearchIcon } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useGlobalSearch } from "../../hooks/useApi";

export default function Search() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchResults, isLoading } = useGlobalSearch(debouncedQuery);

  const conversations: any[] = searchResults?.conversations ?? [];
  const projects: any[] = searchResults?.projects ?? [];
  const proofPages: any[] = searchResults?.proof_pages ?? searchResults?.proofPages ?? [];

  const totalCount = conversations.length + projects.length + proofPages.length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[rgba(0,0,0,0.08)] bg-white">
        <div className="px-8 py-6">
          <h1 className="text-xl tracking-tight">Search</h1>
          <p className="mt-1 text-[13px] text-[#717182]">
            Search across conversations, projects, and proof pages
          </p>
        </div>
      </header>

      <div className="p-8">
        {/* Search Bar */}
        <Card className="mb-6 border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-sm">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#717182]" />
            <Input
              placeholder="Search by keyword, project, tag, or content..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 pl-12 text-[15px] border-none bg-transparent focus-visible:ring-0"
            />
          </div>
        </Card>

        {/* Loading state */}
        {isLoading && debouncedQuery.length >= 2 && (
          <div className="mb-6 text-center text-[13px] text-[#717182]">Searching...</div>
        )}

        {/* Empty state — query entered but no results */}
        {!isLoading && debouncedQuery.length >= 2 && totalCount === 0 && (
          <div className="mb-6 rounded-md border border-[rgba(0,0,0,0.08)] bg-white p-8 text-center shadow-sm">
            <p className="text-[14px] text-[#717182]">No results found for "{debouncedQuery}"</p>
          </div>
        )}

        {/* Prompt state — nothing typed yet */}
        {debouncedQuery.length < 2 && !isLoading && (
          <div className="mb-6 rounded-md border border-[rgba(0,0,0,0.08)] bg-white p-8 text-center shadow-sm">
            <p className="text-[13px] text-[#717182]">Type at least 2 characters to search</p>
          </div>
        )}

        {/* Results Tabs */}
        {totalCount > 0 && (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">
                All Results <Badge variant="secondary" className="ml-2 bg-[#F5F5F7]">{totalCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="conversations">
                Conversations <Badge variant="secondary" className="ml-2 bg-[#F5F5F7]">{conversations.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="projects">
                Projects <Badge variant="secondary" className="ml-2 bg-[#F5F5F7]">{projects.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="proofs">
                Proof Pages <Badge variant="secondary" className="ml-2 bg-[#F5F5F7]">{proofPages.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* All Results */}
            <TabsContent value="all" className="space-y-6">
              {/* Projects Section */}
              {projects.length > 0 && (
                <div>
                  <div className="mb-3 text-[13px] uppercase tracking-wider text-[#717182]">
                    Projects
                  </div>
                  <div className="space-y-3">
                    {projects.map((project: any) => (
                      <Link key={project.id} to={`/app/projects/${project.id}`} className="block">
                        <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-sm hover:border-[rgba(0,0,0,0.15)] transition-all">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="mb-1 flex items-center gap-3">
                                <h3 className="text-[14px]">{project.title ?? project.name ?? "Untitled project"}</h3>
                                {project.relevance != null && (
                                  <div className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-mono text-blue-700">
                                    {Math.round(project.relevance * 100)}% match
                                  </div>
                                )}
                              </div>
                              <p className="mb-2 text-[13px] text-[#717182]">{project.description}</p>
                              {project.conversationCount != null && (
                                <div className="text-[13px] text-[#717182]">
                                  {project.conversationCount} conversations
                                </div>
                              )}
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <span>View Project</span>
                            </Button>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversations Section */}
              {conversations.length > 0 && (
                <div>
                  <div className="mb-3 text-[13px] uppercase tracking-wider text-[#717182]">
                    Conversations
                  </div>
                  <div className="space-y-3">
                    {conversations.map((conv: any) => (
                      <Link key={conv.id} to={`/app/conversations/${conv.id}`} className="block">
                        <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-sm hover:border-[rgba(0,0,0,0.15)] transition-all">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="mb-1 flex items-center gap-3">
                                <h3 className="text-[14px]">{conv.title}</h3>
                                {conv.relevance != null && (
                                  <div className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-mono text-blue-700">
                                    {Math.round(conv.relevance * 100)}% match
                                  </div>
                                )}
                              </div>
                              {conv.snippet && (
                                <p className="mb-2 text-[13px] text-[#717182] italic">{conv.snippet}</p>
                              )}
                              {conv.project && (
                                <Badge variant="secondary" className="bg-[#F5F5F7]">
                                  {conv.project}
                                </Badge>
                              )}
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <span>View Conversation</span>
                            </Button>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Proof Pages Section */}
              {proofPages.length > 0 && (
                <div>
                  <div className="mb-3 text-[13px] uppercase tracking-wider text-[#717182]">
                    Proof Pages
                  </div>
                  <div className="space-y-3">
                    {proofPages.map((proof: any) => (
                      <Link key={proof.id} to={`/p/${proof.slug ?? proof.id}`} className="block">
                        <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-sm hover:border-[rgba(0,0,0,0.15)] transition-all">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="mb-2 flex items-center gap-3">
                                <h3 className="text-[14px]">{proof.projectName ?? proof.project_name}</h3>
                                {proof.relevance != null && (
                                  <div className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-mono text-blue-700">
                                    {Math.round(proof.relevance * 100)}% match
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                {proof.cai != null && (
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-[11px] uppercase tracking-wider text-[#717182]">CAI</span>
                                    <span className="font-mono text-[15px]" style={{ color: 'var(--score-cai)' }}>
                                      {proof.cai}
                                    </span>
                                  </div>
                                )}
                                {proof.hls != null && (
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-[11px] uppercase tracking-wider text-[#717182]">HLS</span>
                                    <span className="font-mono text-[15px]" style={{ color: 'var(--score-hls)' }}>
                                      {proof.hls}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <span>View Proof Page</span>
                            </Button>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="conversations" className="space-y-3">
              {conversations.map((conv: any) => (
                <Link key={conv.id} to={`/app/conversations/${conv.id}`} className="block">
                  <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-sm hover:border-[rgba(0,0,0,0.15)] transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-3">
                          <h3 className="text-[14px]">{conv.title}</h3>
                          {conv.relevance != null && (
                            <div className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-mono text-blue-700">
                              {Math.round(conv.relevance * 100)}% match
                            </div>
                          )}
                        </div>
                        {conv.snippet && (
                          <p className="mb-2 text-[13px] text-[#717182] italic">{conv.snippet}</p>
                        )}
                        {conv.project && (
                          <Badge variant="secondary" className="bg-[#F5F5F7]">
                            {conv.project}
                          </Badge>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <span>View Conversation</span>
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))}
            </TabsContent>

            <TabsContent value="projects" className="space-y-3">
              {projects.map((project: any) => (
                <Link key={project.id} to={`/app/projects/${project.id}`} className="block">
                  <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-sm hover:border-[rgba(0,0,0,0.15)] transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-3">
                          <h3 className="text-[14px]">{project.title ?? project.name ?? "Untitled project"}</h3>
                          {project.relevance != null && (
                            <div className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-mono text-blue-700">
                              {Math.round(project.relevance * 100)}% match
                            </div>
                          )}
                        </div>
                        <p className="mb-2 text-[13px] text-[#717182]">{project.description}</p>
                        {project.conversationCount != null && (
                          <div className="text-[13px] text-[#717182]">
                            {project.conversationCount} conversations
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <span>View Project</span>
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))}
            </TabsContent>

            <TabsContent value="proofs" className="space-y-3">
              {proofPages.map((proof: any) => (
                <Link key={proof.id} to={`/p/${proof.slug ?? proof.id}`} className="block">
                  <Card className="border border-[rgba(0,0,0,0.08)] bg-white p-5 shadow-sm hover:border-[rgba(0,0,0,0.15)] transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <h3 className="text-[14px]">{proof.projectName ?? proof.project_name}</h3>
                          {proof.relevance != null && (
                            <div className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-mono text-blue-700">
                              {Math.round(proof.relevance * 100)}% match
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          {proof.cai != null && (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[11px] uppercase tracking-wider text-[#717182]">CAI</span>
                              <span className="font-mono text-[15px]" style={{ color: 'var(--score-cai)' }}>
                                {proof.cai}
                              </span>
                            </div>
                          )}
                          {proof.hls != null && (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[11px] uppercase tracking-wider text-[#717182]">HLS</span>
                              <span className="font-mono text-[15px]" style={{ color: 'var(--score-hls)' }}>
                                {proof.hls}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <span>View Proof Page</span>
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
