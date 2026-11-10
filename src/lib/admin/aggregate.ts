import { researchContent } from "@/config";
import type { ResearchQuestionId } from "@/config/schema";
import type { GameplayRecord, InterestRecord, ResearchRecord } from "@/lib/analytics/schema";
import { hasSubstantiveAnswer } from "@/lib/research/schema";

/**
 * Pure aggregation for the admin dashboard.
 *
 * Integrity rules:
 * - Unique visitors, game sessions, completed games, research respondents,
 *   interested participants and onboarding leads are counted separately.
 * - Research responses are de-duplicated to one per visit (latest wins), so
 *   replays never create extra respondents.
 * - Every percentage carries its numerator and denominator.
 * - Gameplay scores are never joined with research answers.
 */

export interface Filters {
  eventCode?: string;
  /** Inclusive, YYYY-MM-DD in Singapore time. */
  from?: string;
  to?: string;
  workFunction?: string;
  frequency?: string;
  capability?: string;
}

export interface Ratio {
  count: number;
  n: number;
  /** Percentage with one decimal place, or null when n = 0. */
  pct: number | null;
}

export interface OptionCount extends Ratio {
  id: string;
  label: string;
}

export interface Distribution {
  question: ResearchQuestionId;
  prompt: string;
  kind: "single" | "multi";
  /** Respondents who answered this question (the denominator). */
  answered: number;
  skipped: number;
  notApplicable: number;
  /** Multi-select only: answered with no option selected. */
  emptySelections: number;
  options: OptionCount[];
}

export interface CrossTab {
  rowQuestion: ResearchQuestionId;
  colQuestion: ResearchQuestionId;
  rows: { id: string; label: string; n: number; cells: Ratio[] }[];
  cols: { id: string; label: string }[];
}

export interface Lead {
  eventCode: string;
  count: number;
  updatedAt: string;
}

export interface Summary {
  generatedAt: string;
  sampleLabel: string;
  filters: Filters;
  researchFiltersActive: boolean;
  participation: {
    uniqueVisitors: number;
    sessionsStarted: number;
    gamesCompleted: number;
    visitorsCompleted: number;
    completionRate: Ratio;
    avgPlayDurationMs: number | null;
    researchRespondents: number;
    researchParticipationRate: Ratio;
    abandoned: Record<string, number>;
  };
  needs: {
    distributions: Distribution[];
    noChallenges: Ratio;
  };
  engagement: {
    interested: number;
    declined: number;
    formsgQrShown: number;
    formsgLinkOpened: number;
    onboardingLeads: number | null;
    interestRate: Ratio;
    interestByFunction: OptionCount[];
    interestByEvent: { eventCode: string; uniqueVisitors: number; interested: Ratio }[];
    funnel: { id: string; label: string; value: number | null; note?: string }[];
  };
  crossTabs: CrossTab[];
  executiveSummary: string[];
}

export const MIN_REPORTABLE_N = 5;
export const SAMPLE_LABEL =
  "Self-selected sample of showcase participants who chose to play. Not representative of all public officers.";

export function ratio(count: number, n: number): Ratio {
  return { count, n, pct: n > 0 ? Math.round((count * 1000) / n) / 10 : null };
}

const SGT_OFFSET_MS = 8 * 60 * 60 * 1000;
export function sgDate(iso: string): string {
  return new Date(Date.parse(iso) + SGT_OFFSET_MS).toISOString().slice(0, 10);
}

function inScope(r: { eventCode: string; recordedAt: string }, f: Filters): boolean {
  if (f.eventCode && r.eventCode !== f.eventCode) return false;
  const d = sgDate(r.recordedAt);
  if (f.from && d < f.from) return false;
  if (f.to && d > f.to) return false;
  return true;
}

/** Latest research record per visit (by recordedAt, then recordId for ties). */
export function latestResearchPerVisit(rows: readonly ResearchRecord[]): ResearchRecord[] {
  const byVisit = new Map<string, ResearchRecord>();
  for (const r of rows) {
    const prev = byVisit.get(r.visitId);
    if (
      !prev ||
      r.recordedAt > prev.recordedAt ||
      (r.recordedAt === prev.recordedAt && r.recordId > prev.recordId)
    ) {
      byVisit.set(r.visitId, r);
    }
  }
  return [...byVisit.values()];
}

const singleValue = (r: ResearchRecord, q: "workFunction" | "frequency" | "capability") => {
  const a = r.answers[q];
  return a?.status === "answered" ? a.value : undefined;
};

const selected = (r: ResearchRecord, q: ResearchQuestionId): string[] => {
  const a = r.answers[q];
  if (!a || a.status !== "answered") return [];
  return "value" in a ? [a.value] : a.values;
};

function distribution(q: ResearchQuestionId, respondents: readonly ResearchRecord[]): Distribution {
  const def = researchContent.questions[q];
  let answered = 0;
  let skipped = 0;
  let notApplicable = 0;
  let emptySelections = 0;
  const counts = new Map<string, number>();
  for (const r of respondents) {
    const a = r.answers[q];
    if (!a) continue;
    if (a.status === "skipped") skipped++;
    else if (a.status === "not_applicable") notApplicable++;
    else {
      answered++;
      const vals = "value" in a ? [a.value] : a.values;
      if (vals.length === 0) emptySelections++;
      for (const v of vals) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  }
  return {
    question: q,
    prompt: def.prompt,
    kind: def.kind,
    answered,
    skipped,
    notApplicable,
    emptySelections,
    options: def.options.map((o) => ({ id: o.id, label: o.label, ...ratio(counts.get(o.id) ?? 0, answered) })),
  };
}

function crossTab(
  rowQ: ResearchQuestionId,
  colQ: ResearchQuestionId,
  respondents: readonly ResearchRecord[],
): CrossTab {
  const rowDef = researchContent.questions[rowQ];
  const colDef = researchContent.questions[colQ];
  return {
    rowQuestion: rowQ,
    colQuestion: colQ,
    cols: colDef.options.map((o) => ({ id: o.id, label: o.label })),
    rows: rowDef.options.map((ro) => {
      // Denominator: respondents in this row who answered the column question.
      const inRow = respondents.filter((r) => selected(r, rowQ).includes(ro.id) && r.answers[colQ]?.status === "answered");
      return {
        id: ro.id,
        label: ro.label,
        n: inRow.length,
        cells: colDef.options.map((co) => ratio(inRow.filter((r) => selected(r, colQ).includes(co.id)).length, inRow.length)),
      };
    }),
  };
}

const distinct = <T>(xs: Iterable<T>) => new Set(xs).size;

export function aggregate(
  input: {
    gameplay: readonly GameplayRecord[];
    research: readonly ResearchRecord[];
    interest: readonly InterestRecord[];
    leads: readonly Lead[];
  },
  filters: Filters = {},
  now: Date = new Date(),
): Summary {
  const gameplay = input.gameplay.filter((r) => inScope(r, filters));
  const interestAll = input.interest.filter((r) => inScope(r, filters));
  const researchLatest = latestResearchPerVisit(input.research.filter((r) => inScope(r, filters)));
  const respondentsAll = researchLatest.filter((r) => hasSubstantiveAnswer(r.answers));

  const researchFiltersActive = Boolean(filters.workFunction || filters.frequency || filters.capability);
  const respondents = respondentsAll.filter(
    (r) =>
      (!filters.workFunction || singleValue(r, "workFunction") === filters.workFunction) &&
      (!filters.frequency || singleValue(r, "frequency") === filters.frequency) &&
      (!filters.capability || singleValue(r, "capability") === filters.capability),
  );
  const respondentVisits = new Set(respondents.map((r) => r.visitId));
  const interest = researchFiltersActive ? interestAll.filter((r) => respondentVisits.has(r.visitId)) : interestAll;

  // Participation (filtered by event/date only).
  const started = gameplay.filter((r) => r.type === "session_started");
  const completed = gameplay.filter(
    (r): r is Extract<GameplayRecord, { type: "session_completed" }> => r.type === "session_completed",
  );
  const uniqueVisitors = distinct(started.map((r) => r.visitId));
  const sessionsStarted = distinct(started.map((r) => r.gameSessionId));
  const gamesCompleted = distinct(completed.map((r) => r.gameSessionId));
  const visitorsCompleted = distinct(completed.map((r) => r.visitId));
  const avgPlayDurationMs =
    completed.length > 0 ? Math.round(completed.reduce((s, r) => s + r.durationMs, 0) / completed.length) : null;
  const abandoned: Record<string, number> = {};
  for (const r of gameplay) {
    if (r.type === "session_abandoned") abandoned[r.reason] = (abandoned[r.reason] ?? 0) + 1;
  }

  // Engagement.
  const visitsWith = (t: InterestRecord["type"]) => new Set(interest.filter((r) => r.type === t).map((r) => r.visitId));
  const interestedVisits = visitsWith("interest_expressed");
  const formsgLinkOpened = visitsWith("formsg_link_opened").size;
  const leadsInScope = input.leads.filter((l) => !filters.eventCode || l.eventCode === filters.eventCode);
  const onboardingLeads = leadsInScope.length > 0 ? leadsInScope.reduce((s, l) => s + l.count, 0) : null;

  const wfDef = researchContent.questions.workFunction;
  const interestByFunction: OptionCount[] = wfDef.options.map((o) => {
    const group = respondentsAll.filter((r) => singleValue(r, "workFunction") === o.id);
    const interestedInGroup = group.filter((r) => interestedVisits.has(r.visitId)).length;
    return { id: o.id, label: o.label, ...ratio(interestedInGroup, group.length) };
  });

  const eventCodes = [...new Set(gameplay.map((r) => r.eventCode))].sort();
  const interestByEvent = eventCodes.map((eventCode) => {
    const visits = new Set(started.filter((r) => r.eventCode === eventCode).map((r) => r.visitId));
    const interested = [...interestedVisits].filter((v) => visits.has(v)).length;
    return { eventCode, uniqueVisitors: visits.size, interested: ratio(interested, visits.size) };
  });

  const questions: ResearchQuestionId[] = ["workFunction", "frequency", "contentTypes", "challenges", "tools", "capability"];
  const distributions = questions.map((q) => distribution(q, respondents));
  const challengesDist = distributions.find((d) => d.question === "challenges")!;
  const noneOpt = challengesDist.options.find((o) => o.id === "none");
  const noChallenges = ratio(noneOpt?.count ?? 0, challengesDist.answered);

  const funnel: Summary["engagement"]["funnel"] = [
    { id: "visitors", label: "Unique visitors who started a game", value: uniqueVisitors },
    { id: "completed", label: "Visitors who completed a game", value: visitorsCompleted },
    { id: "respondents", label: "Shared research answers", value: respondentsAll.length },
    { id: "interested", label: "Expressed interest in SGT 2.0", value: interestedVisits.size },
    {
      id: "formsg",
      label: "Opened the FormSG link",
      value: formsgLinkOpened,
      note: "Kiosk QR scans cannot be measured; QR displays are counted separately.",
    },
    {
      id: "leads",
      label: "Onboarding leads (entered manually from FormSG)",
      value: onboardingLeads,
      note: onboardingLeads === null ? "Not entered yet." : undefined,
    },
  ];

  const summary: Summary = {
    generatedAt: now.toISOString(),
    sampleLabel: SAMPLE_LABEL,
    filters,
    researchFiltersActive,
    participation: {
      uniqueVisitors,
      sessionsStarted,
      gamesCompleted,
      visitorsCompleted,
      completionRate: ratio(gamesCompleted, sessionsStarted),
      avgPlayDurationMs,
      researchRespondents: respondentsAll.length,
      researchParticipationRate: ratio(respondentsAll.length, uniqueVisitors),
      abandoned,
    },
    needs: { distributions, noChallenges },
    engagement: {
      interested: interestedVisits.size,
      declined: visitsWith("interest_declined").size,
      formsgQrShown: visitsWith("formsg_qr_shown").size,
      formsgLinkOpened,
      onboardingLeads,
      interestRate: ratio(interestedVisits.size, uniqueVisitors),
      interestByFunction,
      interestByEvent,
      funnel,
    },
    crossTabs: [
      crossTab("frequency", "challenges", respondents),
      crossTab("workFunction", "capability", respondents),
      crossTab("workFunction", "frequency", respondents),
    ],
    executiveSummary: [],
  };
  summary.executiveSummary = executiveSummary(summary, respondents.length);
  return summary;
}

const fmt = (r: Ratio) => (r.pct === null ? "n/a" : `${r.pct}% (${r.count} of ${r.n})`);

function topOption(d: Distribution | undefined, exclude: string[] = []): OptionCount | undefined {
  return d?.options.filter((o) => !exclude.includes(o.id) && o.count > 0).sort((a, b) => b.count - a.count)[0];
}

/** Plain-language findings generated only from collected data, with n shown. */
export function executiveSummary(s: Summary, respondentN: number): string[] {
  const p = s.participation;
  const lines: string[] = [];
  lines.push(
    `${p.uniqueVisitors} unique visitors started ${p.sessionsStarted} game sessions; ${p.gamesCompleted} sessions were completed (completion rate ${fmt(p.completionRate)}).`,
  );
  lines.push(`${p.researchRespondents} visitors shared research answers (${fmt(p.researchParticipationRate)} of visitors).`);
  if (respondentN < MIN_REPORTABLE_N) {
    lines.push(
      `Too few research respondents in this view to summarise needs (n = ${respondentN}; minimum ${MIN_REPORTABLE_N}).`,
    );
  } else {
    const byQ = (q: ResearchQuestionId) => s.needs.distributions.find((d) => d.question === q);
    const freq = byQ("frequency");
    const frequent = freq
      ? ratio(
          freq.options.filter((o) => o.id === "daily" || o.id === "weekly").reduce((a, o) => a + o.count, 0),
          freq.answered,
        )
      : ratio(0, 0);
    lines.push(`Respondents who translate daily or weekly: ${fmt(frequent)}.`);
    const ch = topOption(byQ("challenges"), ["none", "other"]);
    if (ch) lines.push(`Most-selected challenge: "${ch.label}" ${fmt(ch)}.`);
    lines.push(`Respondents reporting none of the listed challenges: ${fmt(s.needs.noChallenges)}.`);
    const tool = topOption(byQ("tools"), ["none", "other"]);
    if (tool) lines.push(`Most-used current approach: "${tool.label}" ${fmt(tool)}.`);
    const cap = topOption(byQ("capability"), ["none", "unsure"]);
    if (cap) lines.push(`Most-picked capability: "${cap.label}" ${fmt(cap)}.`);
  }
  const e = s.engagement;
  lines.push(
    `${e.interested} visitors expressed interest (${fmt(e.interestRate)} of visitors); ${e.formsgLinkOpened} opened the FormSG link.` +
      (e.onboardingLeads === null ? " Onboarding leads not yet entered." : ` Onboarding leads recorded: ${e.onboardingLeads}.`),
  );
  lines.push(s.sampleLabel);
  return lines;
}
