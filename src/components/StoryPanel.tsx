import { useEffect, useRef, useState } from 'react';
// Choice is not a named export in all inkjs versions; use the inferred type instead.
type Choice = { text: string };
import { useGameStore, type PanelEntry } from '../store/gameStore';
import './StoryPanel.css';

// ---------- Close button ----------

function CloseButton({ onClose }: { onClose: () => void }) {
  const [closing, setClosing] = useState(false);

  return (
    <button
      className={`panel-close-btn ${closing ? 'closing' : ''}`}
      onClick={closing ? undefined : () => setClosing(true)}
      onAnimationEnd={closing ? onClose : undefined}
    >
      — CLOSE —
    </button>
  );
}

// ---------- Log entries ----------

function StoryEntry({ text }: { text: string }) {
  return <p className="panel-story-line">{text}</p>;
}

function MonologueEntry({ label, threshold, line, color }: {
  label: string; threshold: number; line: string; color: string;
}) {
  return (
    <div className="panel-monologue" style={{ borderLeftColor: color }}>
      <div className="panel-monologue-header">
        <span className="panel-monologue-skill" style={{ color }}>{label.toUpperCase()}</span>
        <span className="panel-monologue-dc">DC {threshold}</span>
      </div>
      <p className="panel-monologue-line">{line}</p>
    </div>
  );
}

function Entry({ entry }: { entry: PanelEntry }) {
  if (entry.type === 'story') return <StoryEntry text={entry.text} />;
  return (
    <MonologueEntry
      label={entry.label}
      threshold={entry.threshold}
      line={entry.line}
      color={entry.color}
    />
  );
}

// ---------- Skill tooltip ----------

function SkillTooltip({ skillLabel, dc }: { skillLabel: string; dc: number }) {
  const skills    = useGameStore(s => s.skills);
  const inventory = useGameStore(s => s.inventory);

  const skill = skills.find(s => s.label.toLowerCase() === skillLabel.toLowerCase());
  if (!skill) return null;

  const bonuses = inventory
    .filter(i => i.slot !== null && (i.statBonuses[skill.id] ?? 0) !== 0 && skill.discovered)
    .map(i => ({ label: i.label, bonus: i.statBonuses[skill.id]! }));

  const total = skill.baseStat + bonuses.reduce((sum, b) => sum + b.bonus, 0);

  return (
    <div className="skill-tooltip">
      <div className="skill-tooltip-header" style={{ color: skill.color }}>
        {skill.label.toUpperCase()}  DC {dc}
      </div>
      <div className="skill-tooltip-row">
        <span>Base</span><span>{skill.baseStat}</span>
      </div>
      {bonuses.map(b => (
        <div key={b.label} className="skill-tooltip-row bonus">
          <span>{b.label}</span><span>+{b.bonus}</span>
        </div>
      ))}
      <div className="skill-tooltip-divider" />
      <div className="skill-tooltip-row total">
        <span>Total</span><span>{total}</span>
      </div>
    </div>
  );
}

// ---------- Choice label with optional DC prefix ----------

// Ink uses [DC N Skill] as the suppressed prefix, so choice.text arrives as "DC N Skill rest of text"
const DC_PATTERN = /^DC (\d+) ([A-Za-z]+) (.*)/s;

function ChoiceLabel({ text }: { text: string }) {
  const skills = useGameStore(s => s.skills);
  const [showTooltip, setShowTooltip] = useState(false);

  const match = DC_PATTERN.exec(text);
  if (!match) return <>{text}</>;

  const [, dcStr, skillLabel, rest] = match;
  const dc    = parseInt(dcStr, 10);
  const skill = skills.find(s => s.label.toLowerCase() === skillLabel.toLowerCase());
  const color = skill?.color ?? '#aaa';

  return (
    <>
      <span
        className="choice-dc-prefix"
        style={{ color }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        [DC {dc} {skillLabel}]
        {showTooltip && <SkillTooltip skillLabel={skillLabel} dc={dc} />}
      </span>
      {rest}
    </>
  );
}

// ---------- Main panel ----------

export function StoryPanel() {
  const story              = useGameStore(s => s.story);
  const panelLog           = useGameStore(s => s.panelLog);
  const addStoryLine       = useGameStore(s => s.addStoryLine);
  const closeDialogue      = useGameStore(s => s.closeDialogue);
  const visitedChoices     = useGameStore(s => s.visitedChoices);
  const markChoiceVisited  = useGameStore(s => s.markChoiceVisited);
  const currentKnotId      = useGameStore(s => s.currentKnotId);

  const [revealCount, setRevealCount] = useState(0);
  const [choices, setChoices]         = useState<Choice[]>([]);
  const [ended, setEnded]             = useState(false);
  const bottomRef        = useRef<HTMLDivElement>(null);
  const initializedForRef = useRef<typeof story>(undefined);

  useEffect(() => {
    // Guard against re-running on remount when story hasn't changed
    // (e.g. user switches tabs and comes back to CASEBOOK).
    if (story === initializedForRef.current) return;
    initializedForRef.current = story;

    setRevealCount(0);
    setChoices([]);
    setEnded(false);
    if (!story || !story.canContinue) return;

    const text = (story.Continue() ?? '').trim();
    if (text) addStoryLine(text);

    const newChoices = story.currentChoices;
    setChoices(newChoices);
    if (!story.canContinue && newChoices.length === 0) setEnded(true);

    const newLen = useGameStore.getState().panelLog.length;
    if (newLen > 0) setRevealCount(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [revealCount, choices.length, ended]);

  const callContinue = () => {
    if (!story || !story.canContinue) return;
    const prevLen = panelLog.length;
    const text = (story.Continue() ?? '').trim();
    if (text) addStoryLine(text);
    const newChoices = story.currentChoices;
    setChoices(newChoices);
    if (!story.canContinue && newChoices.length === 0) setEnded(true);
    const newLen = useGameStore.getState().panelLog.length;
    if (newLen > prevLen) setRevealCount(prevLen + 1);
  };

  const handleNext = () => {
    if (revealCount < panelLog.length) {
      setRevealCount(c => c + 1);
      return;
    }
    callContinue();
  };

  const choose = (index: number, choiceText: string) => {
    if (currentKnotId) {
      markChoiceVisited(`${currentKnotId}:${choiceText}`);
    }
    story!.ChooseChoiceIndex(index);
    setChoices([]);
    callContinue();
  };

  const visibleLog  = panelLog.slice(0, revealCount);
  const allRevealed = revealCount >= panelLog.length;
  const showNext    = !allRevealed || (story?.canContinue ?? false);
  const showChoices = allRevealed && !ended && choices.length > 0;
  const showClose   = allRevealed && ended;

  return (
    <div className="story-panel">
      <div className="story-panel-label">◈ CASEBOOK</div>
      <div className="story-panel-scroll">
        {visibleLog.map(entry => <Entry key={entry.id} entry={entry} />)}
        <div ref={bottomRef} />
      </div>
      <div className="story-panel-controls">
        {showChoices && choices.map((choice, i) => {
          const key     = currentKnotId ? `${currentKnotId}:${choice.text}` : choice.text;
          const visited = visitedChoices[key] === true;
          return (
            <button
              key={i}
              className={`panel-choice-btn ${visited ? 'visited' : ''}`}
              onClick={() => choose(i, choice.text)}
            >
              <ChoiceLabel text={choice.text} />
            </button>
          );
        })}
        {showNext && !showChoices && (
          <button className="panel-continue-btn" onClick={handleNext}>▶</button>
        )}
        {showClose && <CloseButton onClose={closeDialogue} />}
        {!story && <span className="panel-empty">—</span>}
      </div>
    </div>
  );
}
