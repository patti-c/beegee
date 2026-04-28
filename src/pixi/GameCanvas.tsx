import { useCallback, useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { useGameStore } from '../store/gameStore';
import { buildScene } from './scene';

const GAME_WIDTH  = 960;
const GAME_HEIGHT = 720;

interface Props {
  onHotspotClick: (knotId: string) => void;
}

export function GameCanvas({ onHotspotClick }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const appRef        = useRef<Application | null>(null);
  const callbackRef   = useRef(onHotspotClick);
  const currentSceneId = useGameStore(s => s.currentSceneId);

  useEffect(() => {
    callbackRef.current = onHotspotClick;
  }, [onHotspotClick]);

  // Reads current scene from store and redraws the stage. Safe to call any time
  // after appRef is set — uses getState() so it's never stale.
  const rebuildScene = useCallback(() => {
    const app = appRef.current;
    if (!app) return;
    app.stage.removeChildren();
    const { scenes, currentSceneId, navigateTo, openCharacterDialogue } = useGameStore.getState();
    const scene = scenes.find(s => s.id === currentSceneId);
    if (!scene) return;
    buildScene(
      app,
      scene,
      (knotId) => callbackRef.current(knotId),
      openCharacterDialogue,
      navigateTo,
    );
  }, []); // stable: only reads refs and store state directly

  // App lifecycle — runs once. Initialises Pixi and draws the first scene.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const app = new Application();
    let initialized = false;
    let cancelled   = false;

    (async () => {
      await app.init({
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        backgroundColor: 0x000000,
        antialias: true,
      });
      initialized = true;

      if (cancelled) { app.destroy(true); return; }

      appRef.current = app;
      container.appendChild(app.canvas);
      rebuildScene();
    })();

    return () => {
      cancelled = true;
      appRef.current = null;
      if (initialized) app.destroy(true);
    };
  }, [rebuildScene]);

  // Scene change — redraws whenever currentSceneId changes.
  // If appRef isn't ready yet (still initialising), the lifecycle effect above
  // will call rebuildScene() once init completes.
  useEffect(() => {
    rebuildScene();
  }, [currentSceneId, rebuildScene]);

  return <div ref={containerRef} style={{ width: GAME_WIDTH, height: GAME_HEIGHT }} />;
}
