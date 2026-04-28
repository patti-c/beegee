import { useEffect } from 'react';
import type { SkillCheckResult } from '../store/gameStore';
import './SkillCheckModal.css';

interface Props {
  result: SkillCheckResult;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 3000;

export function SkillCheckModal({ result, onDismiss }: Props) {
  const { label, roll, effectiveStat, threshold, passed } = result;

  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="skill-check-backdrop" onClick={onDismiss}>
      <div className={`skill-check-modal ${passed ? 'pass' : 'fail'}`} onClick={e => e.stopPropagation()}>
        <div className="check-label">SKILL CHECK</div>
        <div className="check-skill-name">{label.toUpperCase()}</div>

        <div className="check-math">
          <div className="check-term">
            <span className="check-value roll">{roll}</span>
            <span className="check-term-label">roll</span>
          </div>
          <span className="check-op">+</span>
          <div className="check-term">
            <span className="check-value">{effectiveStat}</span>
            <span className="check-term-label">stat</span>
          </div>
          <span className="check-op">=</span>
          <div className="check-term">
            <span className="check-value total">{roll + effectiveStat}</span>
            <span className="check-term-label">vs {threshold}</span>
          </div>
        </div>

        <div className={`check-result ${passed ? 'pass' : 'fail'}`}>
          {passed ? '✓  SUCCESS' : '✗  FAILURE'}
        </div>
      </div>
    </div>
  );
}
