"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { researchContent } from "@/config";
import { shuffleWithPinned } from "@/lib/game/rng";
import type { SingleAnswer } from "@/lib/research/schema";
import { Icon, type IconName } from "@/components/ui/Icon";
import { InterludeFrame } from "./InterludeFrame";

const icons: Record<string, IconName> = {
  web_portal: "chat",
  website_translation: "globe",
  api_integration: "code",
  glossary: "search",
  none: "cross",
  unsure: "info",
};

/** Final pick: the most relevant capability, presented as power-up orbs. */
export function PowerUpPick({ seed, onDone }: { seed: number; onDone: (a: SingleAnswer) => void }) {
  const q = researchContent.questions.capability;
  const options = useMemo(() => shuffleWithPinned(q.options, seed + 4, (o) => !!o.pinned), [q.options, seed]);
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (id: string) => {
    if (picked) return;
    setPicked(id);
    setTimeout(() => onDone({ status: "answered", value: id }), 650);
  };

  return (
    <InterludeFrame
      testId="interlude-capability"
      title="Pick wiTTy's next power-up for you"
      subtitle="Which capability would help your real work the most?"
      onSkip={() => onDone({ status: "skipped" })}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label={q.prompt}>
        {options.map((o) => {
          const on = picked === o.id;
          const pinned = !!o.pinned;
          return (
            <motion.button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => choose(o.id)}
              disabled={!!picked && !on}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.96 }}
              animate={on ? { scale: [1, 1.12, 1] } : {}}
              className={`flex min-h-32 flex-col items-center justify-center gap-2 border-2 border-ink p-3 text-center font-bold text-ink ${
                on ? "bg-mint shadow-pixel-lg" : pinned ? "checker border-dashed text-muted shadow-pixel-sm" : "bg-paper shadow-pixel"
              }`}
              data-testid={`cap-${o.id}`}
            >
              <span
                className={`flex h-14 w-14 items-center justify-center border-2 border-ink ${on ? "bg-forest text-paper" : pinned ? "bg-paper" : "bg-butter"} ${
                  !pinned && !picked ? "animate-pulse-ring" : ""
                }`}
              >
                <Icon name={on ? "check" : (icons[o.id] ?? "sparkle")} size={26} />
              </span>
              <span className="leading-tight">{o.label}</span>
            </motion.button>
          );
        })}
      </div>
    </InterludeFrame>
  );
}
