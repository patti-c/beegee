import { useGameStore } from '../store/gameStore';
import './SkillsPanel.css';

export function SkillsPanel() {
  const skills    = useGameStore(s => s.skills);
  const inventory = useGameStore(s => s.inventory);

  const discovered = skills.filter(s => s.discovered);

  const bonusesFor = (skillId: string) =>
    inventory
      .filter(i => i.slot !== null && (i.statBonuses[skillId] ?? 0) !== 0)
      .map(i => ({ label: i.label, bonus: i.statBonuses[skillId]! }));

  if (discovered.length === 0) {
    return (
      <div className="skills-panel">
        <div className="skills-empty">No skills unlocked.</div>
      </div>
    );
  }

  return (
    <div className="skills-panel">
      {discovered.map(skill => {
        const bonuses = bonusesFor(skill.id);
        const total   = skill.baseStat + bonuses.reduce((s, b) => s + b.bonus, 0);
        return (
          <div key={skill.id} className="skill-card">
            <div className="skill-card-header">
              <span className="skill-card-name" style={{ color: skill.color }}>
                {skill.label.toUpperCase()}
              </span>
              <span className="skill-card-total" style={{ color: skill.color }}>{total}</span>
            </div>
            <p className="skill-card-voice">{skill.voicePersonality}</p>
            <div className="skill-card-breakdown">
              <span className="skill-breakdown-row">
                <span>Base</span><span>{skill.baseStat}</span>
              </span>
              {bonuses.map(b => (
                <span key={b.label} className="skill-breakdown-row bonus">
                  <span>{b.label}</span><span>+{b.bonus}</span>
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
