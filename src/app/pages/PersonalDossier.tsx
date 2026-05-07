import { useMemo, useState } from "react";
import { ArrowRight, Copy, ExternalLink, Link as LinkIcon, Mail, Share2, UserRound } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useCurrentUser, useProofPages, useWorkProfile } from "../../hooks/useApi";
import { asArray, proofPageTitle } from "../lib/poaw";

function slugify(value: string) {
  const slug = value
    .replace(/^@/, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "operator";
}

function userName(user: any) {
  return user?.name || user?.full_name || user?.display_name || user?.handle || user?.email || "Operator";
}

function userBio(user: any, workProfile: any) {
  return (
    user?.bio ||
    user?.profile_bio ||
    workProfile?.narrative ||
    "A public archive of AI-assisted work artifacts, published topics, and evidence-backed capability signals."
  );
}

function contactCards(user: any) {
  return [
    user?.email ? { label: "Email", value: user.email, href: `mailto:${user.email}` } : null,
    user?.website ? { label: "Website", value: user.website, href: user.website } : null,
    user?.linkedin ? { label: "LinkedIn", value: user.linkedin, href: user.linkedin } : null,
    user?.github ? { label: "GitHub", value: user.github, href: user.github } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; href: string }>;
}

export default function PersonalDossier() {
  const { data: user } = useCurrentUser();
  const { data: proofPagesData } = useProofPages();
  const { data: workProfile } = useWorkProfile();
  const [customSlug, setCustomSlug] = useState("");

  const displayName = userName(user);
  const defaultSlug = slugify(user?.handle || displayName || user?.email || "operator");
  const selectedSlug = slugify(customSlug || defaultSlug);
  const publicUrl = `https://proofofaiwork.com/proof/${selectedSlug}`;
  const pages = asArray<any>(proofPagesData);
  const publishedPages = pages.filter((page) => page?.status === "published");
  const contacts = contactCards(user);

  const grouped = useMemo(() => {
    const groups = new Map<string, any[]>();
    for (const page of publishedPages) {
      const key = page?.project_title || page?.custom_meta?.category || "Published proof";
      const list = groups.get(key) ?? [];
      list.push(page);
      groups.set(key, list);
    }
    return Array.from(groups.entries());
  }, [publishedPages]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Dossier link copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-6 py-7 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">
                <UserRound className="h-3.5 w-3.5" />
                Personal Dossier
              </div>
              <h1 className="mt-2 text-3xl tracking-tight">{displayName}</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#5C5C5C]">
                A shareable professional AI-work profile for employers, partners, clients, and reviewers.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={copyLink} className="bg-[#123C36] text-white hover:bg-[#0E302B]">
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <a href={publicUrl} target="_blank" rel="noreferrer">
                <Button variant="outline">
                  Open public dossier
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_340px]">
          <section className="space-y-6">
            <Card className="border border-[#D8D2C4] bg-white p-6">
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#6B6B66]">Public identity</div>
              <p className="mt-3 text-[15px] leading-relaxed text-[#3A3A36]">{userBio(user, workProfile)}</p>
              {workProfile?.archetype?.label ? (
                <div className="mt-5 rounded-md border border-[#D8D2C4] bg-[#FBF8F1] p-4">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-[#6B6B66]">Archetype pattern</div>
                  <div className="mt-1 text-xl tracking-tight">{workProfile.archetype.label}</div>
                </div>
              ) : null}
            </Card>

            <Card className="border border-[#D8D2C4] bg-white p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[#6B6B66]">Published topics</div>
                  <h2 className="mt-1 text-2xl tracking-tight">Evidence grouped for review.</h2>
                </div>
                <span className="text-[12px] text-[#6B6B66]">{publishedPages.length} public artifact{publishedPages.length === 1 ? "" : "s"}</span>
              </div>
              {grouped.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {grouped.map(([group, pages]) => (
                    <div key={group} className="border-t border-[#EAE3CF] pt-4">
                      <div className="text-[12px] uppercase tracking-[0.12em] text-[#6B6B66]">{group}</div>
                      <div className="mt-2 grid gap-2">
                        {pages.map((page) => (
                          <div key={page.id} className="flex flex-col gap-3 rounded-md border border-[#D8D2C4] bg-[#FBF8F1] p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <div className="truncate text-[14px] text-[#161616]">{proofPageTitle(page)}</div>
                              {page.summary ? <div className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#6B6B66]">{page.summary}</div> : null}
                            </div>
                            <Link to="/app/proof-pages" className="shrink-0 text-[12px] text-[#315D8A] hover:underline">
                              Manage
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-md border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-6 text-center text-[13px] text-[#6B6B66]">
                  No published topics yet. Publish proof pages first, then this dossier becomes a sendable archive.
                </div>
              )}
            </Card>
          </section>

          <aside className="space-y-4">
            <Card className="border border-[#D8D2C4] bg-[#123C36] p-5 text-white">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/60">Share destination</div>
              <label className="mt-4 block text-[12px] text-white/72">Choose public proof slug</label>
              <input
                value={customSlug}
                onChange={(event) => setCustomSlug(event.target.value)}
                placeholder={defaultSlug}
                className="mt-1 h-10 w-full rounded-md border border-white/18 bg-white/8 px-3 text-[13px] text-white outline-none placeholder:text-white/42 focus:border-white/40"
              />
              <div className="mt-3 rounded-md border border-white/12 bg-black/12 p-3 font-mono text-[11px] leading-relaxed text-white/78">
                {publicUrl}
              </div>
              <div className="mt-4 grid gap-2">
                <Button onClick={copyLink} className="bg-[#F7F4ED] text-[#123C36] hover:bg-white">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Dossier
                </Button>
                <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 text-[12px] text-white/72 hover:text-white">
                  Open {selectedSlug}
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </Card>

            <Card className="border border-[#D8D2C4] bg-white p-5">
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#6B6B66]">Contact and links</div>
              {contacts.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {contacts.map((contact) => (
                    <a
                      key={`${contact.label}-${contact.value}`}
                      href={contact.href}
                      className="flex items-center gap-3 rounded-md border border-[#D8D2C4] bg-[#FBF8F1] p-3 text-[13px] transition-colors hover:border-[#A88F5F] hover:bg-white"
                    >
                      {contact.label === "Email" ? <Mail className="h-4 w-4 text-[#315D8A]" /> : <LinkIcon className="h-4 w-4 text-[#315D8A]" />}
                      <span className="min-w-0 flex-1 truncate">{contact.value}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-[13px] leading-relaxed text-[#6B6B66]">
                  Add contact details in account settings to make the dossier easier to forward.
                </p>
              )}
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
