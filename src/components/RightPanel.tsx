import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { StoryPanel } from './StoryPanel';
import { InventoryPanel } from './InventoryPanel';
import { SkillsPanel } from './SkillsPanel';
import './RightPanel.css';

type Tab = 'casebook' | 'inventory' | 'skills';

function SaveBar() {
  const saveGame = useGameStore(s => s.saveGame);
  const loadGame = useGameStore(s => s.loadGame);
  const hasSave  = useGameStore(s => s.hasSave);

  const [flash, setFlash] = useState<'saved' | 'loaded' | 'error' | null>(null);

  const handleSave = () => {
    saveGame();
    setFlash('saved');
    setTimeout(() => setFlash(null), 1800);
  };

  const handleLoad = () => {
    const ok = loadGame();
    setFlash(ok ? 'loaded' : 'error');
    setTimeout(() => setFlash(null), 1800);
  };

  return (
    <div className="save-bar">
      <button className="save-btn" onClick={handleSave}>
        {flash === 'saved' ? '✓ saved' : 'save'}
      </button>
      <button
        className="save-btn"
        onClick={handleLoad}
        disabled={!hasSave()}
      >
        {flash === 'loaded' ? '✓ loaded' : flash === 'error' ? '✗ failed' : 'load'}
      </button>
    </div>
  );
}

export function RightPanel() {
  const [tab, setTab] = useState<Tab>('casebook');

  return (
    <div className="right-panel">
      <div className="right-panel-tabs">
        <button
          className={`rp-tab ${tab === 'casebook' ? 'active' : ''}`}
          onClick={() => setTab('casebook')}
        >
          CASEBOOK
        </button>
        <button
          className={`rp-tab ${tab === 'inventory' ? 'active' : ''}`}
          onClick={() => setTab('inventory')}
        >
          INVENTORY
        </button>
        <button
          className={`rp-tab ${tab === 'skills' ? 'active' : ''}`}
          onClick={() => setTab('skills')}
        >
          SKILLS
        </button>
      </div>
      <div className="right-panel-content">
        {tab === 'casebook'  && <StoryPanel />}
        {tab === 'inventory' && <InventoryPanel />}
        {tab === 'skills'    && <SkillsPanel />}
      </div>
      <SaveBar />
    </div>
  );
}
