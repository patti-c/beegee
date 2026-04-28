import { Application, Graphics, Text, TextStyle } from 'pixi.js';
import type { SceneData } from '../store/gameStore';

const HOTSPOT_STYLE   = new TextStyle({ fill: 0xffcc00, fontSize: 13, fontFamily: 'monospace' });
const CHARACTER_STYLE = new TextStyle({ fill: 0xc4a0f5, fontSize: 13, fontFamily: 'monospace' });
const LABEL_STYLE     = new TextStyle({ fill: 0x888888, fontSize: 16, fontFamily: 'monospace', letterSpacing: 4 });
const NAV_STYLE       = new TextStyle({ fill: 0x555555, fontSize: 36, fontFamily: 'monospace' });

export function buildScene(
  app: Application,
  scene: SceneData,
  onHotspotClick: (knotId: string) => void,
  onCharacterClick: (characterId: string, knotId: string) => void,
  onNavigate: (sceneId: string) => void,
) {
  const { width, height } = app.screen;

  // Background
  const bg = new Graphics();
  bg.rect(0, 0, width, height).fill(scene.backgroundColor);
  app.stage.addChild(bg);

  // Floor
  const floor = new Graphics();
  floor.rect(0, height * 0.75, width, height * 0.25).fill(scene.floorColor);
  app.stage.addChild(floor);

  // Hotspots
  for (const hs of scene.hotspots) {
    const g = new Graphics();
    g.rect(hs.x, hs.y, hs.width, hs.height)
      .fill({ color: 0xffcc00, alpha: 0.12 })
      .stroke({ color: 0xffcc00, width: 1.5 });
    g.interactive = true;
    g.cursor = 'pointer';
    g.on('pointerdown', () => onHotspotClick(hs.knotId));
    app.stage.addChild(g);

    const label = new Text({ text: hs.label, style: HOTSPOT_STYLE });
    label.x = hs.x + 6;
    label.y = hs.y + 4;
    app.stage.addChild(label);
  }

  // Character hotspot
  if (scene.character) {
    const ch = scene.character;
    const cg = new Graphics();
    cg.rect(ch.hotspot.x, ch.hotspot.y, ch.hotspot.width, ch.hotspot.height)
      .fill({ color: 0xc4a0f5, alpha: 0.07 })
      .stroke({ color: 0xc4a0f5, width: 1, alpha: 0.35 });
    cg.interactive = true;
    cg.cursor = 'pointer';
    cg.on('pointerdown', () => onCharacterClick(ch.id, ch.knotId));
    app.stage.addChild(cg);

    const clabel = new Text({ text: 'talk', style: CHARACTER_STYLE });
    clabel.x = ch.hotspot.x + 6;
    clabel.y = ch.hotspot.y + 4;
    app.stage.addChild(clabel);
  }

  // Navigation arrows
  if (scene.connections.left) {
    addNavArrow(app, 'left', scene.connections.left, onNavigate, width, height);
  }
  if (scene.connections.right) {
    addNavArrow(app, 'right', scene.connections.right, onNavigate, width, height);
  }

  // Scene label
  const sceneLabel = new Text({ text: scene.label, style: LABEL_STYLE });
  sceneLabel.x = 40;
  sceneLabel.y = 40;
  app.stage.addChild(sceneLabel);
}

function addNavArrow(
  app: Application,
  direction: 'left' | 'right',
  targetId: string,
  onNavigate: (id: string) => void,
  width: number,
  height: number,
) {
  const arrowW = 56;
  const arrowH = 120;
  const x = direction === 'left' ? 0 : width - arrowW;
  const y = height / 2 - arrowH / 2;

  const hit = new Graphics();
  hit.rect(x, y, arrowW, arrowH).fill({ color: 0xffffff, alpha: 0.03 });
  hit.interactive = true;
  hit.cursor = 'pointer';
  hit.on('pointerover',  () => { glyph.style = { ...NAV_STYLE, fill: 0x888888 }; });
  hit.on('pointerout',   () => { glyph.style = NAV_STYLE; });
  hit.on('pointerdown',  () => onNavigate(targetId));
  app.stage.addChild(hit);

  const glyph = new Text({ text: direction === 'left' ? '‹' : '›', style: NAV_STYLE });
  glyph.x = direction === 'left' ? 10 : width - 42;
  glyph.y = height / 2 - 22;
  app.stage.addChild(glyph);
}
