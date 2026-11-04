"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Archive, ArchiveRestore, ArrowLeft, Camera, Check, CheckCheck, ExternalLink, FileText, FolderOpen, Inbox as InboxIcon, Info, Mail, MapPin, Paperclip, Phone, Search, Send, X } from "lucide-react";
import { Avatar } from "@/components/ui/misc";
import { useRealtime, useRealtimeConnected } from "@/lib/realtime-client";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import { TranslateButton, useAutoTranslate } from "@/components/translate/auto-translate";

type ListItem = {
  id: string;
  side: "client" | "pro";
  subject: string | null;
  project: { id: string; title: string } | null;
  other: { name: string; avatarKey: string | null; href: string | null };
  archived: boolean;
  unread: boolean;
  lastMessage: { body: string; mine: boolean; at: string } | null;
  lastMessageAt: string;
};
type AttachmentT = { id: string; name: string; mime: string; size: number; url: string; width: number | null; height: number | null };
type Msg = { id: string; body: string; createdAt: string; mine: boolean; senderName: string; attachments: AttachmentT[]; nonce?: string; pending?: boolean; failed?: boolean };
type Detail = {
  id: string;
  side: "client" | "pro";
  subject: string | null;
  archived: boolean;
  project: { id: string; title: string; city: string | null; country: string | null; budget: string | null; timeline: string | null } | null;
  other: { userId: string; name: string; contactName?: string; avatarKey: string | null; href: string | null; location: string; email: string | null; phone: string | null; role: string };
};
type FileRow = AttachmentT & { conversationId: string; with: string; createdAt: string };

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "archived", label: "Archived" },
] as const;

export function Inbox({ initialId, me }: { initialId: string | null; me: { id: string; name: string; verified: boolean; role: string } }) {
  const tr = useT();
  const router = useRouter();
  const [tab, setTab] = useState<"inbox" | "files">("inbox");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ListItem[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(initialId);
  const [showDetails, setShowDetails] = useState(false);

  const loadList = useCallback(async () => {
    const res = await fetch(`/api/conversations?filter=${filter}&q=${encodeURIComponent(query)}`, { cache: "no-store" });
    if (!res.ok) return;
    const list: ListItem[] = (await res.json()).items;
    setItems(list);
    // Sur grand écran, ouvre la conversation la plus récente par défaut.
    setActiveId((current) => current ?? (list.length && window.matchMedia("(min-width: 1024px)").matches ? list[0]!.id : null));
  }, [filter, query]);

  const live = useRealtimeConnected();
  useEffect(() => {
    const t = setTimeout(loadList, query ? 250 : 0);
    const id = live ? null : setInterval(() => !document.hidden && loadList(), 15_000);
    return () => {
      clearTimeout(t);
      if (id) clearInterval(id);
    };
  }, [loadList, query, live]);
  useRealtime((event) => {
    if (event.type === "conversations" || event.type === "reconnected") void loadList();
  });

  function open(id: string) {
    setActiveId(id);
    setItems((list) => list?.map((i) => (i.id === id ? { ...i, unread: false } : i)) ?? null);
    router.replace(`/messages?c=${id}`, { scroll: false });
  }

  return (
    <div className="flex h-[calc(100dvh-68px)] flex-col">
      <div className="flex items-center gap-6 border-b border-line px-4 sm:px-6">
        {(["inbox", "files"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("relative py-3.5 text-[13.5px] font-medium capitalize", tab === t ? "text-ink" : "text-muted hover:text-ink")}>
            {t === "inbox" ? tr("Inbox") : tr("Shared files")}
            {tab === t && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-ink" />}
          </button>
        ))}
      </div>

      {tab === "files" ? (
        <FilesView onOpen={(id) => { setTab("inbox"); open(id); }} />
      ) : (
        <div className="grid min-h-0 flex-1 lg:grid-cols-[340px_1fr] xl:grid-cols-[340px_1fr_300px]">
          {/* Liste */}
          <section className={cn("flex min-h-0 flex-col border-r border-line", activeId && "hidden lg:flex")} aria-label={tr("Conversations")}>
            <div className="space-y-3 border-b border-line p-4">
              <label className="flex items-center gap-2 rounded-sm bg-paper px-3.5 py-2 ring-1 ring-line focus-within:ring-ink">
                <Search className="size-4 text-muted" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("Search conversations")} className="w-full bg-transparent text-sm focus:outline-none" aria-label={tr("Search conversations")} />
              </label>
              <div className="flex gap-1">
                {FILTERS.map((f) => (
                  <button key={f.id} onClick={() => setFilter(f.id)} className={cn("rounded-sm px-3 py-1 text-[12.5px]", filter === f.id ? "bg-ink text-paper" : "text-muted hover:bg-sand hover:text-ink")}>
                    {tr(f.label)}
                  </button>
                ))}
              </div>
            </div>
            <ul className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
              {items === null ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex gap-3 border-b border-line/60 p-4">
                    <span className="size-11 animate-pulse rounded-full bg-sand" />
                    <span className="flex-1 space-y-2 py-1">
                      <span className="block h-3 w-1/2 animate-pulse rounded bg-sand" />
                      <span className="block h-3 w-4/5 animate-pulse rounded bg-sand" />
                    </span>
                  </li>
                ))
              ) : items.length === 0 ? (
                <li className="px-6 py-16 text-center text-sm text-muted">
                  <InboxIcon className="mx-auto mb-3 size-8 text-line" strokeWidth={1.3} />
                  {filter === "all" ? (me.role === "PRO" ? tr("Requests from creatives will appear here.") : tr("Start a conversation from a maker's profile.")) : tr("Nothing here.")}
                  {filter === "all" && me.role !== "PRO" && (
                    <Link href="/search" className="mt-3 block font-medium text-ink underline">
                      {tr("Explore makers")}</Link>
                  )}
                </li>
              ) : (
                items.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => open(c.id)} className={cn("flex w-full gap-3 border-b border-line/60 p-4 text-left transition", activeId === c.id ? "bg-paper" : "hover:bg-paper/60")}>
                      <Avatar name={c.other.name} imageKey={c.other.avatarKey} size={44} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn("truncate text-[14px]", c.unread ? "font-bold" : "font-semibold")}>{c.other.name}</span>
                          <span className="shrink-0 text-[11px] text-muted">{tr.relative(c.lastMessageAt)}</span>
                        </span>
                        {c.project && <span className="block truncate text-[12px] text-brass-dark">{tr(c.project.title)}</span>}
                        <span className={cn("mt-0.5 flex items-center gap-1.5 text-[13px]", c.unread ? "text-ink" : "text-muted")}>
                          <span className="truncate">
                            {c.lastMessage?.mine && tr("You: ")}
                            {tr(c.lastMessage?.body)}
                          </span>
                          {c.unread && <span className="ml-auto size-2 shrink-0 rounded-full bg-brass" aria-label={tr("Unread")} />}
                        </span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Fil */}
          {activeId ? (
            <Thread
              key={activeId}
              id={activeId}
              me={me}
              showDetails={showDetails}
              onToggleDetails={() => setShowDetails((s) => !s)}
              onBack={() => {
                setActiveId(null);
                router.replace("/messages", { scroll: false });
              }}
              onChanged={loadList}
            />
          ) : (
            <div className="hidden flex-col items-center justify-center text-center text-muted lg:flex xl:col-span-2">
              <InboxIcon className="size-10 text-line" strokeWidth={1.2} />
              <p className="mt-3 text-sm">{tr("Select a conversation")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Thread({ id, me, showDetails, onToggleDetails, onBack, onChanged }: { id: string; me: { id: string; verified: boolean }; showDetails: boolean; onToggleDetails: () => void; onBack: () => void; onChanged: () => void }) {
  const tr = useT();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [otherReadAt, setOtherReadAt] = useState<string | null>(null);
  const [online, setOnline] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const lastAt = useRef<string | null>(null);
  const stickToBottom = useRef(true);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);
  const unreadWhileHidden = useRef(false);
  const live = useRealtimeConnected();

  /** Ajoute les nouveaux messages reçus (temps réel ou rattrapage), sans doublon. */
  const appendIncoming = useCallback((incoming: Msg[]) => {
    setMessages((prev) => {
      let next = prev;
      for (const m of incoming) {
        if (next.some((p) => p.id === m.id)) continue;
        // Notre propre message renvoyé par le serveur : remplace la bulle « en cours d'envoi ».
        const pendingIndex = m.nonce ? next.findIndex((p) => p.id === m.nonce) : -1;
        next = pendingIndex >= 0 ? next.map((p, i) => (i === pendingIndex ? m : p)) : [...next, m];
      }
      return next;
    });
    const last = incoming.at(-1);
    if (last && (!lastAt.current || last.createdAt > lastAt.current)) lastAt.current = last.createdAt;
  }, []);

  /** Récupère ce qui a pu être manqué (chargement, reconnexion, mode dégradé sans temps réel). */
  const catchUp = useCallback(async () => {
    const res = await fetch(`/api/conversations/${id}${lastAt.current ? `?after=${encodeURIComponent(lastAt.current)}` : ""}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setOtherReadAt(data.otherReadAt);
    setOnline(data.otherOnline);
    if (data.messages.length) {
      appendIncoming(data.messages);
      onChanged();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, appendIncoming]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch(`/api/conversations/${id}`, { cache: "no-store" });
      if (!alive) return;
      if (!res.ok) return setError("This conversation is not available.");
      const data = await res.json();
      setDetail(data.conversation);
      setMessages(data.messages);
      setOtherReadAt(data.otherReadAt);
      setOnline(data.otherOnline);
      lastAt.current = data.messages.at(-1)?.createdAt ?? null;
      onChanged();
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Mode dégradé : sans connexion temps réel (réseau filtrant, reconnexion en cours), interrogation toutes les 4 s.
  useEffect(() => {
    if (live) return;
    const poll = setInterval(() => !document.hidden && catchUp(), 4000);
    return () => clearInterval(poll);
  }, [live, catchUp]);

  const markRead = useCallback(() => {
    unreadWhileHidden.current = false;
    void fetch(`/api/conversations/${id}/read`, { method: "POST" }).then(() => onChanged());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Messages arrivés pendant que l'onglet était en arrière-plan : lus au retour sur l'onglet.
  useEffect(() => {
    const onVisible = () => !document.hidden && unreadWhileHidden.current && markRead();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [markRead]);

  useEffect(() => () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
  }, []);

  useRealtime((event) => {
    if (event.type === "reconnected") return void catchUp();
    if (event.type === "presence") {
      if (event.userId === detail?.other.userId) setOnline(event.online);
      return;
    }
    if (!("conversationId" in event) || event.conversationId !== id) return;
    if (event.type === "message") {
      appendIncoming([event.message]);
      if (!event.message.mine) {
        setTyping(false);
        setOnline(true);
        if (document.hidden) unreadWhileHidden.current = true;
        else markRead();
      }
    } else if (event.type === "read") {
      setOtherReadAt(event.at);
    } else if (event.type === "typing") {
      setTyping(true);
      setOnline(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 4000);
    }
  });

  /** Signale la saisie à l'interlocuteur (au plus une fois toutes les 2,5 s). */
  function notifyTyping() {
    const now = Date.now();
    if (now - lastTypingSent.current < 2500) return;
    lastTypingSent.current = now;
    void fetch(`/api/conversations/${id}/typing`, { method: "POST" }).catch(() => {});
  }

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  async function send(body: string, files: File[]) {
    const tempId = `tmp-${Date.now()}`;
    stickToBottom.current = true;
    setMessages((m) => [...m, { id: tempId, body, createdAt: new Date().toISOString(), mine: true, senderName: "", attachments: [], pending: true }]);
    lastTypingSent.current = 0;
    const fd = new FormData();
    fd.set("body", body);
    fd.set("nonce", tempId);
    files.forEach((f) => fd.append("files", f));
    const res = await fetch(`/api/conversations/${id}/messages`, { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessages((m) => m.map((x) => (x.id === tempId ? { ...x, pending: false, failed: true } : x)));
      setError(data.error ?? "Message not sent.");
      return false;
    }
    // Le message a pu arriver d'abord par le flux temps réel : dans ce cas, la bulle temporaire a déjà été remplacée.
    appendIncoming([data.message]);
    setError(null);
    onChanged();
    return true;
  }

  async function toggleArchive() {
    if (!detail) return;
    await fetch(`/api/conversations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived: !detail.archived }) });
    setDetail({ ...detail, archived: !detail.archived });
    onChanged();
  }

  const lastMine = [...messages].reverse().find((m) => m.mine && !m.pending);
  const files = messages.flatMap((m) => m.attachments);

  return (
    <>
      <section className="flex min-h-0 flex-col" aria-label={tr("Conversation")}>
        <header className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
          <button onClick={onBack} className="-ml-2 flex size-9 items-center justify-center rounded-full hover:bg-sand lg:hidden" aria-label={tr("Back")}>
            <ArrowLeft className="size-5" />
          </button>
          {detail ? (
            <>
              <div className="relative">
                <Avatar name={detail.other.name} imageKey={detail.other.avatarKey} size={40} />
                {online && <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-ivory bg-success" title={tr("Online")} aria-label={tr("Online")} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-semibold">{detail.other.name}</p>
                <p className="truncate text-[12px] text-muted">{typing ? <span className="text-brass-dark">{tr("typing…")}</span> : online ? <>{tr("Online ·")}{" "}{detail.project?.title ?? detail.subject}</> : detail.project?.title ?? detail.subject}</p>
              </div>
              <button onClick={toggleArchive} className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-ink" title={detail.archived ? tr("Unarchive") : tr("Archive")} aria-label={detail.archived ? tr("Unarchive") : tr("Archive")}>
                {detail.archived ? <ArchiveRestore className="size-[18px]" /> : <Archive className="size-[18px]" />}
              </button>
              <button onClick={onToggleDetails} className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-ink xl:hidden" aria-label={tr("Details")}>
                <Info className="size-[18px]" />
              </button>
            </>
          ) : (
            <span className="h-10 w-48 animate-pulse rounded bg-sand" />
          )}
        </header>

        <div
          ref={scroller}
          onScroll={(e) => {
            const el = e.currentTarget;
            stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
          className="scrollbar-thin min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-6 sm:px-8"
        >
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
            const grouped = prev && prev.mine === m.mine && !newDay && new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000;
            return (
              <div key={m.id}>
                {newDay && (
                  <p className="my-5 text-center text-[11px] uppercase tracking-[0.15em] text-muted">
                    {tr.date(m.createdAt, { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                )}
                <div className={cn("flex", m.mine ? "justify-end" : "justify-start", !grouped && "mt-3")}>
                  <div className={cn("max-w-[85%] sm:max-w-[70%]", m.pending && "opacity-60")}>
                    {m.attachments.length > 0 && (
                      <div className={cn("mb-1 flex flex-wrap gap-1.5", m.mine && "justify-end")}>
                        {m.attachments.map((a) => (
                          <AttachmentView key={a.id} a={a} />
                        ))}
                      </div>
                    )}
                    {m.body && <MessageBody message={m} />}
                    <p className={cn("mt-1 flex items-center gap-1 text-[10.5px] text-muted", m.mine && "justify-end")}>
                      {m.failed ? <span className="text-danger">{tr("Not sent")}</span> : tr.date(m.createdAt, { hour: "2-digit", minute: "2-digit" })}
                      {m.mine && m.id === lastMine?.id && (otherReadAt && otherReadAt >= m.createdAt ? <CheckCheck className="size-3.5 text-brass" aria-label={tr("Read")} /> : <Check className="size-3.5" aria-label={tr("Sent")} />)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {typing && detail && (
            <div className="mt-3 flex justify-start" aria-live="polite">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-paper px-4 py-3" aria-label={tr("{name} is typing", { name: detail.other.name })}>
                {[0, 150, 300].map((delay) => (
                  <span key={delay} className="size-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {error && <p className="px-6 pb-2 text-sm text-danger">{tr(error)}</p>}
        {me.verified ? (
          <Composer onSend={send} onTyping={notifyTyping} />
        ) : (
          <p className="border-t border-line p-4 text-center text-sm text-muted">
            {tr("Confirm your e-mail address to reply.")}{" "}
            <Link href="/dashboard" className="font-medium text-ink underline">
              {tr("Resend the link")}</Link>
          </p>
        )}
      </section>

      {/* Détails */}
      {detail && (
        <aside className={cn("scrollbar-thin min-h-0 overflow-y-auto border-l border-line bg-paper/50 p-6", showDetails ? "fixed inset-y-0 right-0 z-40 w-[min(90vw,320px)] bg-ivory shadow-2xl xl:static xl:w-auto xl:shadow-none" : "hidden xl:block")}>
          <button onClick={onToggleDetails} className="mb-4 ml-auto flex size-8 items-center justify-center rounded-full hover:bg-sand xl:hidden" aria-label={tr("Close details")}>
            <X className="size-4" />
          </button>
          <p className="text-sm font-semibold">{tr("Details")}</p>
          <div className="mt-5 flex flex-col items-center text-center">
            <Avatar name={detail.other.name} imageKey={detail.other.avatarKey} size={72} />
            <p className="mt-3 font-semibold">{detail.other.name}</p>
            {detail.other.contactName && detail.other.contactName !== detail.other.name && <p className="text-[13px] text-muted">{detail.other.contactName}</p>}
            <p className="mt-0.5 text-[12px] text-muted">{detail.other.role.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</p>
            {detail.other.href && (
              <Link href={detail.other.href} className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-brass-dark hover:underline">
                {tr("View profile")}{" "}<ExternalLink className="size-3.5" />
              </Link>
            )}
          </div>
          <ul className="mt-6 space-y-2.5 border-t border-line pt-5 text-[13px]">
            {detail.other.location && (
              <li className="flex gap-2">
                <MapPin className="size-4 shrink-0 text-muted" /> {detail.other.location}
              </li>
            )}
            {detail.other.email ? (
              <li className="flex gap-2">
                <Mail className="size-4 shrink-0 text-muted" />
                <a href={`mailto:${detail.other.email}`} className="truncate hover:underline">
                  {detail.other.email}
                </a>
              </li>
            ) : (
              detail.side === "client" && (
                <li className="text-[12px] text-muted">
                  <Link href="/pricing" className="underline">
                    {tr("Upgrade to Pro")}</Link>{" "}{tr("to see direct contact details.")}</li>
              )
            )}
            {detail.other.phone && (
              <li className="flex gap-2">
                <Phone className="size-4 shrink-0 text-muted" /> {detail.other.phone}
              </li>
            )}
          </ul>
          {detail.project && (
            <div className="mt-6 border-t border-line pt-5">
              <p className="eyebrow">{tr("Project")}</p>
              <p className="mt-2 text-[14px] font-medium">{tr(detail.project.title)}</p>
              <dl className="mt-2 space-y-1 text-[12.5px] text-muted">
                {detail.project.city && <dd>{[detail.project.city, detail.project.country].filter(Boolean).join(", ")}</dd>}
                {detail.project.timeline && <dd>{tr("Timeline: {timeline}", { timeline: detail.project.timeline })}</dd>}
                {detail.project.budget && <dd>{tr("Budget: {budget}", { budget: detail.project.budget })}</dd>}
              </dl>
              {detail.side === "client" && (
                <Link href={`/dashboard/projects/${detail.project.id}`} className="mt-2 inline-block text-[12.5px] font-medium underline">
                  {tr("Open project")}</Link>
              )}
            </div>
          )}
          <div className="mt-6 border-t border-line pt-5">
            <p className="eyebrow mb-3">{tr("Shared files ({length})", { length: files.length })}</p>
            {files.length === 0 ? (
              <p className="text-[12.5px] text-muted">{tr("Plans, moodboards and quotes you exchange will appear here.")}</p>
            ) : (
              <ul className="space-y-2">
                {files.map((f) => (
                  <li key={f.id}>
                    <a href={f.url} target="_blank" rel="noopener" className="flex items-center gap-2 text-[12.5px] hover:underline">
                      <FileText className="size-4 shrink-0 text-muted" />
                      <span className="truncate">{f.name}</span>
                      <span className="ml-auto shrink-0 text-muted">{tr.bytes(f.size)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      )}
    </>
  );
}

function AttachmentView({ a }: { a: AttachmentT }) {
  const tr = useT();
  if (a.mime.startsWith("image/")) {
    return (
      <a href={a.url} target="_blank" rel="noopener" className="block overflow-hidden rounded-xl border border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.url} alt={a.name} className="max-h-60 max-w-[260px] object-cover" loading="lazy" />
      </a>
    );
  }
  return (
    <a href={`${a.url}?download=${encodeURIComponent(a.name)}`} className="flex items-center gap-3 rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[13px] hover:border-ink/40">
      <FileText className="size-5 text-brass" strokeWidth={1.5} />
      <span>
        <span className="block max-w-[180px] truncate font-medium">{a.name}</span>
        <span className="text-[11px] text-muted">{tr.bytes(a.size)}</span>
      </span>
    </a>
  );
}

function Composer({ onSend, onTyping }: { onSend: (body: string, files: File[]) => Promise<boolean>; onTyping: () => void }) {
  const tr = useT();
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [body]);

  async function submit() {
    if (sending || (!body.trim() && files.length === 0)) return;
    setSending(true);
    const ok = await onSend(body.trim(), files);
    setSending(false);
    if (ok) {
      setBody("");
      setFiles([]);
    }
  }

  const add = (list: FileList | null) => list && setFiles((f) => [...f, ...Array.from(list)].slice(0, 5));

  return (
    <div className="border-t border-line p-3 sm:p-4">
      <div className="rounded-2xl border border-line bg-paper focus-within:border-ink/60">
        {files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-b border-line p-2.5">
            {files.map((f, i) => (
              <span key={i} className="flex items-center gap-1.5 rounded-sm bg-sand py-1 pl-3 pr-1.5 text-[12px]">
                <span className="max-w-40 truncate">{f.name}</span>
                <button onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} className="rounded-sm p-0.5 hover:bg-line" aria-label={tr("Remove {name}", { name: f.name })}>
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <textarea
          ref={textRef}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (e.target.value.trim()) onTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={tr("Your message")}
          aria-label={tr("Your message")}
          className="block w-full resize-none bg-transparent px-4 pt-3 text-[14px] focus:outline-none"
        />
        <div className="flex items-center gap-1 px-2 pb-2">
          <button onClick={() => fileRef.current?.click()} className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-ink" aria-label={tr("Attach a PDF or image")} title={tr("Attach a file (PDF, images)")}>
            <Paperclip className="size-[18px]" />
          </button>
          <button onClick={() => imageRef.current?.click()} className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-ink" aria-label={tr("Add photos")} title={tr("Add photos")}>
            <Camera className="size-[18px]" />
          </button>
          <input ref={fileRef} type="file" multiple accept="application/pdf,image/*" className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
          <input ref={imageRef} type="file" multiple accept="image/*" capture="environment" className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
          <span className="ml-2 hidden text-[11px] text-muted sm:inline">{tr("Enter to send · Shift + Enter for a new line")}</span>
          <button onClick={submit} disabled={sending || (!body.trim() && !files.length)} className="ml-auto flex h-9 items-center gap-2 rounded-sm bg-ink px-4 text-[13px] font-medium text-paper transition hover:bg-ink-soft disabled:opacity-40" aria-label={tr("Send")}>
            {sending ? <span className="size-3.5 animate-spin rounded-full border-2 border-paper border-r-transparent" /> : <Send className="size-3.5" />}
            {tr("Send")}</button>
        </div>
      </div>
    </div>
  );
}

function FilesView({ onOpen }: { onOpen: (conversationId: string) => void }) {
  const tr = useT();
  const [files, setFiles] = useState<FileRow[] | null>(null);
  useEffect(() => {
    fetch("/api/conversations/files", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setFiles(d.items ?? []));
  }, []);
  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="display text-3xl">{tr("Shared files")}</h1>
        <p className="mt-1 text-sm text-muted">{tr("Every plan, moodboard and quote exchanged in your conversations, in one place.")}</p>
        {files === null ? (
          <p className="mt-10 text-sm text-muted">{tr("Loading…")}</p>
        ) : files.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-line p-12 text-center text-sm text-muted">
            <FolderOpen className="mx-auto mb-3 size-8 text-line" />
            {tr("No files yet.")}</div>
        ) : (
          <ul className="mt-8 divide-y divide-line rounded-2xl border border-line bg-paper">
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-4 p-4">
                {f.mime.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt="" className="size-12 rounded-lg object-cover" />
                ) : (
                  <span className="flex size-12 items-center justify-center rounded-lg bg-sand">
                    <FileText className="size-5 text-brass" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <a href={`${f.url}?download=${encodeURIComponent(f.name)}`} className="block truncate text-sm font-medium hover:underline">
                    {f.name}
                  </a>
                  <p className="text-[12px] text-muted">
                    With {f.with} · {tr.bytes(f.size)} · {tr.relative(f.createdAt)}
                  </p>
                </div>
                <button onClick={() => onOpen(f.conversationId)} className="text-[12.5px] font-medium text-brass-dark hover:underline">
                  {tr("Open conversation")}</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Bulle de message ; les messages reçus peuvent être traduits vers la langue de l'utilisateur. */
function MessageBody({ message }: { message: Msg }) {
  const state = useAutoTranslate("message", message.id);
  return (
    <>
      <div className={cn("whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed", message.mine ? "rounded-br-md bg-ink text-paper" : "rounded-bl-md border border-line bg-paper")}>{state.translated?.body ?? message.body}</div>
      {!message.mine && <TranslateButton state={state} className="mt-1 text-muted" />}
    </>
  );
}
