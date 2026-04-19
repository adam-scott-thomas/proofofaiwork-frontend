import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Globe,
  Loader2,
  Plus,
  Power,
  Trash2,
  Zap,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { apiDelete, apiFetch, apiPatch, apiPost } from "../../lib/api";
import { dateTime } from "../lib/poaw";

type Webhook = {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  failure_count: number;
  max_failures: number;
  created_at: string;
};

const AVAILABLE_EVENTS = [
  { id: "assessment.complete", label: "Assessment complete", help: "Fires when an assessment finishes successfully." },
  { id: "assessment.partial", label: "Assessment partial", help: "Fires when some dimensions skip the quality gate but results still ship." },
  { id: "assessment.failed", label: "Assessment failed", help: "Fires on pipeline failure." },
  { id: "request.received", label: "Viewer contact request", help: "Fires when someone submits the contact form on a public proof page." },
  { id: "dispute.updated", label: "Dispute status change", help: "Fires when a dispute moves open → reviewed / resolved / superseded." },
];

export default function Webhooks() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Webhook | null>(null);

  const listQuery = useQuery<Webhook[]>({
    queryKey: ["webhooks"],
    queryFn: () => apiFetch<Webhook[]>(`/webhooks`),
    retry: false,
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiPatch(`/webhooks/${id}`, { is_active: active }),
    onSuccess: () => {
      toast.success("Webhook updated");
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Update failed"),
  });

  const test = useMutation({
    mutationFn: (id: string) => apiPost(`/webhooks/${id}/test`, {}),
    onSuccess: () => toast.success("Test delivery sent"),
    onError: (error: any) => toast.error(error?.message ?? "Test failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/webhooks/${id}`),
    onSuccess: () => {
      toast.success("Webhook deleted");
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
    onError: (error: any) => toast.error(error?.message ?? "Delete failed"),
  });

  const webhooks = listQuery.data ?? [];
  const active = webhooks.filter((hook) => hook.is_active);

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#161616]">
      <header className="border-b border-[#D8D2C4] bg-[#FBF8F1]">
        <div className="px-8 py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="text-[12px] uppercase tracking-[0.16em] text-[#6B6B66]">Settings · Webhooks</div>
              <h1 className="mt-2 text-3xl tracking-tight">Outbound integrations.</h1>
              <p className="mt-2 text-[14px] leading-relaxed text-[#5C5C5C]">
                Subscribe another service to workspace events. Each hook POSTs a signed JSON payload. Hooks
                auto-disable after repeated delivery failures.
              </p>
            </div>
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New webhook
            </Button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
            <Tile label="Total" value={webhooks.length} />
            <Tile label="Active" value={active.length} />
            <Tile label="With failures" value={webhooks.filter((hook) => hook.failure_count > 0).length} />
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-4xl">
          {listQuery.isLoading ? (
            <div className="flex items-center gap-2 p-8 text-[13px] text-[#6B6B66]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading webhooks...
            </div>
          ) : webhooks.length === 0 ? (
            <Card className="border border-dashed border-[#D8D2C4] bg-[#FBF8F1] p-10 text-center text-[13px] text-[#5C5C5C]">
              <Zap className="mx-auto mb-2 h-5 w-5 text-[#6B6B66]" />
              <div className="text-[#161616]">No webhooks configured.</div>
              <div className="mt-1">
                Useful if you want another service (CRM, Slack bot, dashboard) to react to workspace events.
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {webhooks.map((hook) => (
                <WebhookRow
                  key={hook.id}
                  hook={hook}
                  onToggle={(active) => toggle.mutate({ id: hook.id, active })}
                  onTest={() => test.mutate(hook.id)}
                  onDelete={() => setDeleting(hook)}
                  togglePending={toggle.isPending}
                  testPending={test.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["webhooks"] })}
      />

      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this webhook?</DialogTitle>
            <DialogDescription>
              The URL will stop receiving events immediately. In-flight deliveries are not retried.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              className="bg-[#8B2F2F] hover:bg-[#7A2525]"
              disabled={remove.isPending}
              onClick={() => deleting && remove.mutate(deleting.id)}
            >
              {remove.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <Card className="border border-[#D8D2C4] bg-white p-3">
      <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B66]">{label}</div>
      <div className="mt-1 text-2xl tracking-tight">{value}</div>
    </Card>
  );
}

function WebhookRow({
  hook,
  onToggle,
  onTest,
  onDelete,
  togglePending,
  testPending,
}: {
  hook: Webhook;
  onToggle: (active: boolean) => void;
  onTest: () => void;
  onDelete: () => void;
  togglePending: boolean;
  testPending: boolean;
}) {
  const copy = () =>
    navigator.clipboard.writeText(hook.url).then(
      () => toast.success("URL copied"),
      () => toast.error("Copy failed"),
    );
  const failing = hook.failure_count > 0;
  const nearLimit = hook.failure_count >= Math.max(hook.max_failures - 2, 1);

  return (
    <Card className="border border-[#D8D2C4] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase ${
              hook.is_active ? "bg-[#D3E9D9] text-[#1F6A3F]" : "bg-[#EAE3CF] text-[#6B6B66]"
            }`}>
              <Power className="h-2.5 w-2.5" />
              {hook.is_active ? "Active" : "Paused"}
            </span>
            {failing ? (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase ${
                nearLimit ? "bg-[#F3D1D1] text-[#8B2F2F]" : "bg-[#FDF4DC] text-[#8A5F10]"
              }`}>
                <AlertTriangle className="h-2.5 w-2.5" />
                {hook.failure_count} / {hook.max_failures} failures
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 shrink-0 text-[#315D8A]" />
            <span className="truncate font-mono text-[13px] text-[#161616]">{hook.url}</span>
            <button type="button" onClick={copy} className="text-[#6B6B66] hover:text-[#161616]">
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {hook.events.map((event) => (
              <span key={event} className="rounded-full border border-[#D8D2C4] px-2 py-0.5 text-[10px] tracking-[0.06em] text-[#6B6B66]">
                {event}
              </span>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-[#6B6B66]">created {dateTime(hook.created_at)}</div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Button variant="outline" size="sm" onClick={onTest} disabled={testPending}>
            {testPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-2 h-3.5 w-3.5" />}
            Test
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(!hook.is_active)}
            disabled={togglePending}
          >
            <Power className="mr-2 h-3.5 w-3.5" />
            {hook.is_active ? "Pause" : "Activate"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#8B2F2F] hover:bg-[#F3D1D1]/40 hover:text-[#8B2F2F]"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}

function CreateDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<Set<string>>(new Set(AVAILABLE_EVENTS.map((event) => event.id)));

  const create = useMutation({
    mutationFn: () =>
      apiPost<Webhook>(`/webhooks`, {
        url: url.trim(),
        events: Array.from(events),
      }),
    onSuccess: () => {
      toast.success("Webhook created");
      onCreated();
      onClose();
      setUrl("");
    },
    onError: (error: any) => toast.error(error?.message ?? "Create failed"),
  });

  const toggleEvent = (id: string) =>
    setEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const validUrl = /^https?:\/\/.+/.test(url.trim());

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New webhook</DialogTitle>
          <DialogDescription>
            Your receiving endpoint must respond within 10 seconds with any 2xx. Hooks that return non-2xx
            accrue failures; auto-disabled at the failure ceiling.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">URL</label>
            <Input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/poaw-webhook"
              className="mt-1 font-mono text-[12px]"
              autoFocus
            />
            {url.trim() && !validUrl ? (
              <div className="mt-1 text-[11px] text-[#8B2F2F]">URL must start with http:// or https://</div>
            ) : null}
          </div>
          <div>
            <label className="text-[12px] uppercase tracking-[0.1em] text-[#6B6B66]">Subscribe to events</label>
            <div className="mt-2 space-y-1.5">
              {AVAILABLE_EVENTS.map((event) => (
                <label
                  key={event.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md border border-[#D8D2C4] bg-[#FBF8F1] px-3 py-2 hover:bg-white"
                >
                  <input
                    type="checkbox"
                    checked={events.has(event.id)}
                    onChange={() => toggleEvent(event.id)}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#161616]">{event.label}</span>
                      <span className="font-mono text-[10px] text-[#6B6B66]">{event.id}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] leading-relaxed text-[#6B6B66]">{event.help}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || !validUrl || events.size === 0}
          >
            {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Create webhook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
