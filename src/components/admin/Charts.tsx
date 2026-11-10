"use client";

import { useState, type ReactNode } from "react";
import type { CrossTab, OptionCount, Ratio } from "@/lib/admin/aggregate";

/**
 * Lightweight HTML charts for the admin dashboard, following the data-viz rules:
 * thin marks with 4px rounded data ends, recessive grid, text in text tokens,
 * a per-mark hover/focus tooltip, a table view for every chart, and validated
 * ordinal ramps (see globals.css .viz-root).
 */

export const pctText = (r: Ratio) => (r.pct === null ? "n/a" : `${r.pct}%`);
export const ratioText = (r: Ratio) => (r.pct === null ? `0 of 0` : `${r.count} of ${r.n} (${r.pct}%)`);

export function Card({
  title,
  subtitle,
  children,
  actions,
  className = "",
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border p-4 sm:p-5 ${className}`}
      style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
    >
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold">{title}</h3>
          {subtitle ? (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

export function KpiTile({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div className="rounded-2xl border p-4" style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}>
      <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
      {detail ? (
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function Tip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="group/tip relative block focus:outline-none" tabIndex={0} aria-label={text}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-9 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium shadow-lg group-hover/tip:block group-focus/tip:block"
        style={{ background: "var(--text-primary)", color: "var(--surface-1)" }}
      >
        {text}
      </span>
    </span>
  );
}

export function ViewToggle({ table, onChange }: { table: boolean; onChange: (t: boolean) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border text-xs font-semibold" style={{ borderColor: "var(--border)" }}>
      {(["Chart", "Table"] as const).map((v) => {
        const on = (v === "Table") === table;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(v === "Table")}
            className="min-h-8 px-3"
            style={on ? { background: "var(--text-primary)", color: "var(--surface-1)" } : { color: "var(--text-secondary)" }}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

/** Horizontal bar list: one series (magnitude), so a single hue and no legend. */
export function BarList({
  title,
  subtitle,
  items,
  denominatorLabel,
  sort = true,
}: {
  title: string;
  subtitle?: ReactNode;
  items: OptionCount[];
  denominatorLabel: string;
  sort?: boolean;
}) {
  const [table, setTable] = useState(false);
  const rows = sort ? [...items].sort((a, b) => b.count - a.count) : items;
  const max = Math.max(1, ...rows.map((r) => (r.pct ?? 0)));
  return (
    <Card title={title} subtitle={subtitle} actions={<ViewToggle table={table} onChange={setTable} />}>
      {table ? (
        <DataTable
          headers={["Option", "Count", denominatorLabel, "%"]}
          rows={rows.map((r) => [r.label, r.count, r.n, pctText(r)])}
        />
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.id} className="grid grid-cols-[minmax(7rem,14rem)_1fr_auto] items-center gap-3 text-sm">
              <span className="truncate" title={r.label} style={{ color: "var(--text-secondary)" }}>
                {r.label}
              </span>
              <Tip text={`${r.label}: ${ratioText(r)}`}>
                <span className="block h-5 rounded-r py-1" style={{ background: "var(--grid)" }}>
                  <span
                    className="block h-3 rounded-r-[4px]"
                    style={{ width: `${((r.pct ?? 0) / max) * 100}%`, minWidth: r.count > 0 ? 3 : 0, background: "var(--series-1)" }}
                  />
                </span>
              </Tip>
              <span className="w-28 text-right tabular-nums">
                <strong>{pctText(r)}</strong>{" "}
                <span style={{ color: "var(--text-muted)" }}>
                  ({r.count}/{r.n})
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** 100% stacked bars of an ordinal answer (frequency) per group, ordinal blue ramp. */
export function StackedOrdinal({
  title,
  subtitle,
  tab,
}: {
  title: string;
  subtitle?: ReactNode;
  tab: CrossTab;
}) {
  const [table, setTable] = useState(false);
  const ramp = ["var(--ord-1)", "var(--ord-2)", "var(--ord-3)", "var(--ord-4)", "var(--ord-5)"];
  // Darker = more frequent: reverse so "daily" is darkest.
  const colourFor = (i: number) => ramp[tab.cols.length - 1 - i] ?? "var(--ord-3)";
  return (
    <Card title={title} subtitle={subtitle} actions={<ViewToggle table={table} onChange={setTable} />}>
      {table ? (
        <DataTable
          headers={["Group", "n", ...tab.cols.map((c) => c.label)]}
          rows={tab.rows.map((r) => [r.label, r.n, ...r.cells.map((c) => `${c.count} (${pctText(c)})`)])}
        />
      ) : (
        <>
          <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Legend" style={{ color: "var(--text-secondary)" }}>
            {tab.cols.map((c, i) => (
              <li key={c.id} className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: colourFor(i) }} />
                {c.label}
              </li>
            ))}
          </ul>
          <ul className="space-y-2.5">
            {tab.rows.map((r) => (
              <li key={r.id} className="grid grid-cols-[minmax(7rem,14rem)_1fr_3.5rem] items-center gap-3 text-sm">
                <span className="truncate" style={{ color: "var(--text-secondary)" }}>
                  {r.label}
                </span>
                {r.n === 0 ? (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    No responses
                  </span>
                ) : (
                  <span className="flex h-4 gap-[2px]">
                    {r.cells.map((c, i) =>
                      c.count > 0 ? (
                        <span key={i} style={{ width: `${c.pct}%` }} className="block">
                          <Tip text={`${r.label}, ${tab.cols[i]?.label}: ${ratioText(c)}`}>
                            <span
                              className={`block h-4 ${i === r.cells.length - 1 || r.cells.slice(i + 1).every((x) => x.count === 0) ? "rounded-r-[4px]" : ""}`}
                              style={{ background: colourFor(i) }}
                            />
                          </Tip>
                        </span>
                      ) : null,
                    )}
                  </span>
                )}
                <span className="text-right tabular-nums" style={{ color: "var(--text-muted)" }}>
                  n={r.n}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

/** Cross-tabulation heat table: cell shade by row percentage (sequential, one hue). */
export function CrossTabTable({ title, subtitle, tab }: { title: string; subtitle?: ReactNode; tab: CrossTab }) {
  const shade = (pct: number | null) => {
    if (pct === null || pct === 0) return { background: "var(--seq-0)", color: "var(--text-muted)" };
    const steps = ["var(--ord-1)", "var(--ord-2)", "var(--ord-3)", "var(--ord-4)", "var(--ord-5)"];
    const i = Math.min(4, Math.floor(pct / 20));
    return { background: steps[i], color: i >= 2 ? "#ffffff" : "#0b0b0b" };
  };
  return (
    <Card title={title} subtitle={subtitle}>
      <div className="overflow-x-auto">
        <table className="w-full border-separate text-xs" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              <th className="p-2 text-left font-semibold" style={{ color: "var(--text-secondary)" }}>
                Row (n)
              </th>
              {tab.cols.map((c) => (
                <th key={c.id} className="p-2 text-left font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tab.rows.map((r) => (
              <tr key={r.id}>
                <th scope="row" className="whitespace-nowrap p-2 text-left font-medium">
                  {r.label} <span style={{ color: "var(--text-muted)" }}>({r.n})</span>
                </th>
                {r.cells.map((c, i) => (
                  <td key={i} className="rounded p-2 text-center tabular-nums" style={shade(c.pct)} title={`${r.label} / ${tab.cols[i]?.label}: ${ratioText(c)}`}>
                    {r.n === 0 ? "–" : `${c.count} · ${pctText(c)}`}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function DataTable({ headers, rows }: { headers: string[]; rows: (string | number | null)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ color: "var(--text-secondary)" }}>
            {headers.map((h) => (
              <th key={h} className="border-b p-2 text-left font-semibold" style={{ borderColor: "var(--border)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="border-b p-2 tabular-nums" style={{ borderColor: "var(--border)" }}>
                  {c ?? "–"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
