import { useGameStore } from './store/gameStore';
import { GameCanvas } from './pixi/GameCanvas';
import { RightPanel } from './components/RightPanel';
import { SkillCheckModal } from './components/SkillCheckModal';
import './App.css';

const EMOTION_FILTERS: Record<string, string> = {
  neutral:    'none',
  guarded:    'saturate(0.35) brightness(0.8)',
  warm:       'brightness(1.2) saturate(1.4)',
  cold:       'saturate(0.15) brightness(0.65) hue-rotate(180deg)',
  surprised:  'brightness(1.25) saturate(1.1)',
  distressed: 'saturate(0.5) hue-rotate(25deg) brightness(0.85)',
};

function CharacterOverlay() {
  const activeCharacterId = useGameStore(s => s.activeCharacterId);
  const currentSceneId    = useGameStore(s => s.currentSceneId);
  const scenes            = useGameStore(s => s.scenes);
  const characterEmotions = useGameStore(s => s.characterEmotions);

  if (!activeCharacterId) return null;

  const scene     = scenes.find(s => s.id === currentSceneId);
  const character = scene?.character;
  if (!character || character.id !== activeCharacterId) return null;

  const emotion = characterEmotions[character.id] ?? 'neutral';
  const filter  = EMOTION_FILTERS[emotion] ?? 'none';

  return (
    <div className="character-overlay">
      <div className="scene-dim" />
      <div className="character-sprite">
        <div
          className="character-figure"
          style={{
            background:   character.color + '22',
            borderColor:  character.color + '88',
            filter,
            transition:   'filter 0.5s ease',
          }}
        />
        <div className="character-name">
          {character.label.toUpperCase()}
          <span className="character-emotion">{emotion !== 'neutral' ? ` — ${emotion}` : ''}</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const openDialogue      = useGameStore(s => s.openDialogue);
  const pendingCheck      = useGameStore(s => s.pendingCheck);
  const clearPendingCheck = useGameStore(s => s.clearPendingCheck);
  const story             = useGameStore(s => s.story);

  return (
    <main className="game-root">
      <div className="game-layout">
        <div className="canvas-wrapper">
          <GameCanvas onHotspotClick={openDialogue} />
          <CharacterOverlay />
          {story && <div className="canvas-blocker" />}
          {pendingCheck && (
            <SkillCheckModal result={pendingCheck} onDismiss={clearPendingCheck} />
          )}
        </div>
        <RightPanel />
      </div>
    </main>
  );
}

export default App;
