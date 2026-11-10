"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { researchContent } from "@/config";
import type { Filters, Summary } from "@/lib/admin/aggregate";
import { BarList, Card, CrossTabTable, DataTable, KpiTile, StackedOrdinal, pctText, ratioText } from "./Charts";

interface ApiResponse {
  demo: boolean;
  events: { id: string; name: string }[];
  retentionDays: number;
  summary: Summary;
}

const QUESTION_TITLES: Record<string, string> = {
  workFunction: "Work function",
  frequency: "Translation frequency",
  contentTypes: "Content types translated",
  challenges: "Pain points",
  tools: "Current tools and workflows",
  capability: "Most relevant capability",
};

function isDemoUrl() {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1";
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { id: string; label: string }[] }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-10 rounded-lg border px-2 text-sm font-normal"
        style={{ background: "var(--surface-1)", borderColor: "var(--border)", color: "var(--text-primary)" }}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SmallButton({ children, onClick, href, danger }: { children: ReactNode; onClick?: () => void; href?: string; danger?: boolean }) {
  const cls = "inline-flex min-h-10 items-center rounded-lg border px-3 text-sm font-semibold";
  const style = danger
    ? { borderColor: "#d03b3b", color: "#d03b3b" }
    : { borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--surface-1)" };
  return href ? (
    <a href={href} className={cls} style={style}>
      {children}
    </a>
  ) : (
    <button type={onClick ? "button" : "submit"} onClick={onClick} className={cls} style={style}>
      {children}
    </button>
  );
}

export function AdminDashboard() {
  const router = useRouter();
  const [demo] = useState(isDemoUrl);
  const [filters, setFilters] = useState<Filters>({});
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [leadsInput, setLeadsInput] = useState("");
  const [deleteText, setDeleteText] = useState("");
  const [view, setView] = useState<"full" | "exec">("full");

  const query = useMemo(() => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) p.set(k, v);
    if (demo) p.set("demo", "1");
    return p.toString();
  }, [filters, demo]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/summary?${query}`, { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setData((await res.json()) as ApiResponse);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [query, router]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  const set = (k: keyof Filters) => (v: string) => setFilters((f) => ({ ...f, [k]: v || undefined }));
  const s = data?.summary;
  const q = researchContent.questions;

  const post = async (url: string, body: unknown) => {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return { ok: res.ok, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  };

  const importFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const r = await post("/api/admin/import", parsed);
      setNotice(r.ok ? `Imported: ${String(r.json.written)} new, ${String(r.json.duplicates)} duplicates, ${String(r.json.rejected)} rejected.` : "Import failed: invalid file.");
      void load();
    } catch {
      setNotice("Import failed: the file is not valid JSON.");
    }
  };

  const exportHref = (stream: string) => `/api/admin/export?stream=${stream}&${query}`;

  return (
    <div className="viz-root min-h-dvh">
      {demo ? (
        <div className="sticky top-0 z-30 border-b-4 border-dashed px-4 py-2 text-center text-sm font-black uppercase tracking-widest" style={{ background: "var(--warn-bg)", color: "var(--warn-text)", borderColor: "var(--warn-text)" }} data-testid="demo-watermark">
          Synthetic demo data: not real responses. Do not report or share as findings.
        </div>
      ) : null}
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">wiTTy&apos;s Translation Rescue: insights</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Admin only · {demo ? "Demo mode" : "Collected data"} · {s ? `generated ${new Date(s.generatedAt).toLocaleString("en-SG")}` : "loading…"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SmallButton onClick={() => setView(view === "full" ? "exec" : "full")}>{view === "full" ? "Executive summary view" : "Full dashboard"}</SmallButton>
            <SmallButton href={demo ? "/admin" : "/admin?demo=1"}>{demo ? "Exit demo" : "Open demo (synthetic)"}</SmallButton>
            <SmallButton
              onClick={async () => {
                await post("/api/admin/logout", {});
                router.replace("/admin/login");
              }}
            >
              Log out
            </SmallButton>
          </div>
        </header>

        <p className="rounded-xl border px-4 py-2 text-sm" style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--surface-1)" }}>
          <strong>Sample:</strong> {s?.sampleLabel ?? "…"} Percentages show count of n. Research answers are self-reported and are
          never inferred from game scores.
        </p>

        {/* Filters: one row above all charts */}
        <div className="grid grid-cols-2 gap-3 rounded-2xl border p-3 sm:grid-cols-3 lg:grid-cols-7" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }} role="group" aria-label="Filters">
          <Select label="Event" value={filters.eventCode ?? ""} onChange={set("eventCode")} options={(data?.events ?? []).map((e) => ({ id: e.id, label: e.name }))} />
          <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
            From
            <input type="date" value={filters.from ?? ""} onChange={(e) => set("from")(e.target.value)} className="min-h-10 rounded-lg border px-2 text-sm" style={{ background: "var(--surface-1)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
            To
            <input type="date" value={filters.to ?? ""} onChange={(e) => set("to")(e.target.value)} className="min-h-10 rounded-lg border px-2 text-sm" style={{ background: "var(--surface-1)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </label>
          <Select label="Work function" value={filters.workFunction ?? ""} onChange={set("workFunction")} options={q.workFunction.options} />
          <Select label="Frequency" value={filters.frequency ?? ""} onChange={set("frequency")} options={q.frequency.options} />
          <Select label="Capability" value={filters.capability ?? ""} onChange={set("capability")} options={q.capability.options} />
          <div className="flex items-end">
            <SmallButton onClick={() => setFilters({})}>Clear filters</SmallButton>
          </div>
        </div>
        {s?.researchFiltersActive ? (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Work function, frequency and capability filters apply to research and interest metrics. Participation counts are filtered
            by event and date only.
          </p>
        ) : null}

        {error ? <p className="rounded-xl p-3 text-sm" style={{ background: "var(--warn-bg)", color: "var(--warn-text)" }}>{error}</p> : null}
        {notice ? <p className="rounded-xl border p-3 text-sm" role="status" style={{ borderColor: "var(--border)" }}>{notice}</p> : null}

        {s ? (
          <>
            <Card title="Executive summary" subtitle="Generated from collected records only. Small samples are flagged, not summarised.">
              <ul className="list-disc space-y-1.5 pl-5 text-sm" data-testid="exec-summary">
                {s.executiveSummary.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </Card>

            <section aria-label="Participation" className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KpiTile label="Unique visitors" value={s.participation.uniqueVisitors} detail="Distinct visits that started a game" />
              <KpiTile label="Game sessions started" value={s.participation.sessionsStarted} detail="Includes replays" />
              <KpiTile label="Games completed" value={s.participation.gamesCompleted} detail={`Completion rate ${ratioText(s.participation.completionRate)}`} />
              <KpiTile
                label="Average play duration"
                value={s.participation.avgPlayDurationMs === null ? "–" : `${Math.round(s.participation.avgPlayDurationMs / 1000)} s`}
                detail="Completed sessions, including research steps"
              />
              <KpiTile label="Research respondents" value={s.participation.researchRespondents} detail="One per visit; replays not double-counted" />
              <KpiTile label="Research participation" value={pctText(s.participation.researchParticipationRate)} detail={ratioText(s.participation.researchParticipationRate) + " of visitors"} />
              <KpiTile label="No significant challenges" value={pctText(s.needs.noChallenges)} detail={`${ratioText(s.needs.noChallenges)} answering the challenge step`} />
              <KpiTile label="Expressed interest" value={s.engagement.interested} detail={`${ratioText(s.engagement.interestRate)} of visitors`} />
            </section>

            <Card title="From gameplay to voluntary interest" subtitle="Distinct visitors at each stage. Stages are separate measures, not a guaranteed sequence.">
              <DataTable
                headers={["Stage", "Visitors", "Note"]}
                rows={s.engagement.funnel.map((f) => [f.label, f.value ?? "Not entered", f.note ?? ""])}
              />
            </Card>

            {view === "full" ? (
              <>
                <h2 className="mt-2 text-lg font-bold">Translation needs</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {s.needs.distributions.map((d) => (
                    <BarList
                      key={d.question}
                      title={QUESTION_TITLES[d.question] ?? d.question}
                      subtitle={
                        <>
                          {d.kind === "multi" ? "Multi-select: % of respondents who answered. Totals exceed 100%." : "Single choice."} n = {d.answered} answered
                          {d.skipped ? `, ${d.skipped} skipped` : ""}
                          {d.notApplicable ? `, ${d.notApplicable} not applicable` : ""}
                          {d.emptySelections ? `, ${d.emptySelections} selected none of the listed` : ""}.
                          {d.question === "challenges" ? " Asked right after the terminology mission: possible priming." : ""}
                        </>
                      }
                      items={d.options}
                      denominatorLabel="n answered"
                      sort={d.question !== "frequency"}
                    />
                  ))}
                </div>

                <h2 className="mt-2 text-lg font-bold">Comparisons</h2>
                <StackedOrdinal
                  title="Translation frequency by work function"
                  subtitle="Share of each group's respondents. Darker = more frequent."
                  tab={s.crossTabs.find((t) => t.rowQuestion === "workFunction" && t.colQuestion === "frequency")!}
                />
                <div className="grid gap-4">
                  <CrossTabTable
                    title="Pain points by translation frequency"
                    subtitle="Row % of respondents in each frequency group who selected each challenge."
                    tab={s.crossTabs.find((t) => t.rowQuestion === "frequency")!}
                  />
                  <CrossTabTable
                    title="Requested capability by work function"
                    subtitle="Row % within each work function."
                    tab={s.crossTabs.find((t) => t.rowQuestion === "workFunction" && t.colQuestion === "capability")!}
                  />
                </div>

                <h2 className="mt-2 text-lg font-bold">Engagement</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  <BarList
                    title="Interest by work function"
                    subtitle="% of research respondents in each function who expressed interest."
                    items={s.engagement.interestByFunction}
                    denominatorLabel="Respondents in group"
                  />
                  <Card title="Interest by event" subtitle="Expressed interest as a share of unique visitors.">
                    <DataTable
                      headers={["Event", "Unique visitors", "Interested"]}
                      rows={s.engagement.interestByEvent.map((e) => [e.eventCode, e.uniqueVisitors, ratioText(e.interested)])}
                    />
                    <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                      FormSG link opened (mobile): <strong>{s.engagement.formsgLinkOpened}</strong> · FormSG QR displayed (kiosk):{" "}
                      <strong>{s.engagement.formsgQrShown}</strong> · Declined: <strong>{s.engagement.declined}</strong>
                    </p>
                  </Card>
                </div>
              </>
            ) : null}

            {!demo ? (
              <Card title="Data management" subtitle={`Records older than ${data?.retentionDays} days are deleted automatically.`}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">CSV export (current event/date filters):</span>
                    <SmallButton href={exportHref("gameplay")}>Gameplay</SmallButton>
                    <SmallButton href={exportHref("research")}>Research (1 row per respondent)</SmallButton>
                    <SmallButton href={exportHref("interest")}>Interest</SmallButton>
                  </div>
                  <label className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold">Import a kiosk queue export (JSON):</span>
                    <input type="file" accept="application/json,.json" onChange={(e) => e.target.files?.[0] && void importFile(e.target.files[0])} />
                  </label>
                  <form
                    className="flex flex-wrap items-end gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const count = Number(leadsInput);
                      if (!filters.eventCode || !Number.isInteger(count) || count < 0) {
                        setNotice("Choose an event in the filters and enter a whole number of leads.");
                        return;
                      }
                      const r = await post("/api/admin/leads", { eventCode: filters.eventCode, count });
                      setNotice(r.ok ? "Onboarding leads saved." : "Could not save leads.");
                      void load();
                    }}
                  >
                    <label className="flex flex-col gap-1 text-sm font-semibold">
                      Onboarding leads from FormSG (selected event)
                      <input inputMode="numeric" value={leadsInput} onChange={(e) => setLeadsInput(e.target.value.replace(/\D/g, ""))} className="min-h-10 w-32 rounded-lg border px-2" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }} />
                    </label>
                    <SmallButton>Save</SmallButton>
                  </form>
                  <form
                    className="flex flex-wrap items-end gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const r = await post("/api/admin/delete", { confirm: deleteText });
                      setNotice(r.ok ? "All collected data deleted." : 'Type "DELETE ALL DATA" exactly to confirm.');
                      setDeleteText("");
                      void load();
                    }}
                  >
                    <label className="flex flex-col gap-1 text-sm font-semibold">
                      Delete all collected data (irreversible). Type DELETE ALL DATA
                      <input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} className="min-h-10 w-64 rounded-lg border px-2" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }} />
                    </label>
                    <SmallButton danger>Delete</SmallButton>
                  </form>
                </div>
              </Card>
            ) : (
              <Card title="Demo exports" subtitle="Synthetic data. Files are prefixed SYNTHETIC-DEMO.">
                <div className="flex flex-wrap gap-2">
                  <SmallButton href={exportHref("gameplay")}>Gameplay</SmallButton>
                  <SmallButton href={exportHref("research")}>Research</SmallButton>
                  <SmallButton href={exportHref("interest")}>Interest</SmallButton>
                </div>
              </Card>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
