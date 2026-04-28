import { create } from 'zustand';
import { Story } from 'inkjs';
import storyContent from '../ink/story.ink';

// --- Types ---

export type SlotId = 'left_hand' | 'right_hand' | 'headgear' | 'pocket';

export interface Skill {
  id: string;
  label: string;
  baseStat: number;
  voicePersonality: string;
  color: string;
  discovered: boolean;
}

export interface SkillCheckResult {
  skillId: string;
  label: string;
  roll: number;
  effectiveStat: number;
  threshold: number;
  passed: boolean;
}

export type PanelEntry =
  | { type: 'story';     id: number; text: string }
  | { type: 'monologue'; id: number; skillId: string; label: string; threshold: number; line: string; color: string };

export interface InventoryItem {
  id: string;
  label: string;
  description: string;
  statBonuses: Partial<Record<string, number>>;
  slot: SlotId | null;
  allowedSlots: SlotId[];
}

export interface Hotspot {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  knotId: string;
}

export interface CharacterDef {
  id: string;
  label: string;
  color: string; // CSS color for placeholder sprite
  knotId: string;
  hotspot: { x: number; y: number; width: number; height: number };
}

export interface SceneData {
  id: string;
  label: string;
  backgroundColor: number;
  floorColor: number;
  hotspots: Hotspot[];
  character?: CharacterDef;
  connections: { left?: string; right?: string };
}

// --- Initial data ---

const INITIAL_SKILLS: Skill[] = [
  { id: 'logic',      label: 'Logic',      baseStat: 4, voicePersonality: 'dry, methodical',       color: '#5b9cf6', discovered: true  },
  { id: 'empathy',    label: 'Empathy',    baseStat: 6, voicePersonality: 'warm, intuitive',        color: '#f97b8b', discovered: true  },
  { id: 'perception', label: 'Perception', baseStat: 5, voicePersonality: 'nervous, observant',     color: '#a8e6a3', discovered: true  },
  { id: 'composure',  label: 'Composure',  baseStat: 3, voicePersonality: 'sardonic, world-weary',  color: '#c4a0f5', discovered: true  },
  { id: 'intuition',  label: 'Intuition',  baseStat: 4, voicePersonality: 'sudden, wordless',       color: '#f5c060', discovered: false },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'magnifying_glass',
    label: 'Magnifying Glass',
    description: 'A quality lens. Helps you see what others miss.',
    statBonuses: { perception: 2 },
    slot: null,
    allowedSlots: ['left_hand', 'right_hand'],
  },
  {
    id: 'flask',
    label: 'Flask of Rye',
    description: "Dutch courage. Keeps your hands steady.",
    statBonuses: { composure: 2 },
    slot: null,
    allowedSlots: ['left_hand', 'right_hand'],
  },
  {
    id: 'case_file',
    label: 'Case File',
    description: 'Organized notes. Keeps the threads straight.',
    statBonuses: { logic: 1, perception: 1 },
    slot: null,
    allowedSlots: ['left_hand', 'right_hand', 'pocket'],
  },
  {
    id: 'locket',
    label: "Victim's Locket",
    description: 'A personal connection. Hard to look at.',
    statBonuses: { empathy: 3, intuition: 2 },
    slot: null,
    allowedSlots: ['pocket'],
  },
];

// Items not in the starting inventory but obtainable via story events.
const ITEM_CATALOG: Record<string, InventoryItem> = {
  photograph: {
    id: 'photograph',
    label: "Victim's Photograph",
    description: "Three days old. Someone left it for you to find — and someone else marked it.",
    statBonuses: { perception: 1, empathy: 1 },
    slot: null,
    allowedSlots: ['pocket'],
  },
};

const SCENES: SceneData[] = [
  {
    id: 'office',
    label: 'OFFICE — NIGHT',
    backgroundColor: 0x1a1a2e,
    floorColor: 0x2d1b00,
    hotspots: [
      { id: 'examine_desk', label: 'examine', x: 540, y: 360, width: 160, height: 90, knotId: 'examine_desk' },
    ],
    character: {
      id: 'vera_cross',
      label: 'Vera Cross',
      color: '#c4a0f5',
      knotId: 'talk_to_vera',
      hotspot: { x: 180, y: 220, width: 90, height: 260 },
    },
    connections: { right: 'hallway' },
  },
  {
    id: 'hallway',
    label: 'HALLWAY',
    backgroundColor: 0x18120e,
    floorColor: 0x261a0e,
    hotspots: [
      { id: 'locked_door', label: 'examine', x: 400, y: 200, width: 120, height: 280, knotId: 'locked_door' },
    ],
    connections: { left: 'office', right: 'street' },
  },
  {
    id: 'street',
    label: 'STREET — NIGHT',
    backgroundColor: 0x0c1a16,
    floorColor: 0x0a1410,
    hotspots: [
      { id: 'phone_booth', label: 'examine', x: 560, y: 260, width: 100, height: 280, knotId: 'phone_booth' },
    ],
    connections: { left: 'hallway' },
  },
];

// --- Save format ---

const SAVE_KEY = 'beegee_save';

interface SaveData {
  v: 2;
  ts: number;
  sceneId: string;
  flags: Record<string, boolean | string | number>;
  slots: Partial<Record<SlotId, string>>;
  visitedChoices?: Record<string, true>;
  discoveredSkills?: string[];
  acquiredItems?: string[]; // catalog item IDs added during play
}

// --- Helpers ---

function computeEquippedBonuses(inventory: InventoryItem[]): Record<string, number> {
  return inventory
    .filter(i => i.slot !== null)
    .reduce<Record<string, number>>((acc, item) => {
      for (const [skillId, bonus] of Object.entries(item.statBonuses)) {
        acc[skillId] = (acc[skillId] ?? 0) + (bonus ?? 0);
      }
      return acc;
    }, {});
}

let nextId = 0;

// --- Store ---

interface GameStore {
  skills: Skill[];
  inventory: InventoryItem[];
  flags: Record<string, boolean | string | number>;
  story: Story | null;
  checkHistory: SkillCheckResult[][];
  pendingCheck: SkillCheckResult | null;
  panelLog: PanelEntry[];
  scenes: SceneData[];
  currentSceneId: string;
  activeCharacterId: string | null;
  currentKnotId: string | null;
  visitedChoices: Record<string, true>;
  characterEmotions: Record<string, string>;

  openDialogue: (knotId: string) => void;
  openCharacterDialogue: (characterId: string, knotId: string) => void;
  closeDialogue: () => void;
  addStoryLine: (text: string) => void;
  clearPendingCheck: () => void;
  navigateTo: (sceneId: string) => void;
  setFlag: (key: string, value: boolean | string | number) => void;
  addItem: (item: InventoryItem) => void;
  giveItem: (itemId: string) => void;
  equipItem: (itemId: string, slot: SlotId) => void;
  unequipItem: (itemId: string) => void;
  markChoiceVisited: (key: string) => void;
  setCharacterEmotion: (characterId: string, emotion: string) => void;
  grantSkill: (skillId: string) => void;
  removeSkill: (skillId: string) => void;
  skillCheck: (skillId: string, threshold: number) => number;
  triggerMonologue: (skillId: string, threshold: number, line: string) => number;
  triggerCheck: (threshold: number) => SkillCheckResult[];
  saveGame: () => void;
  loadGame: () => boolean;
  hasSave: () => boolean;
}

function makeStory(get: () => GameStore, knotId: string): Story {
  const story = new Story(storyContent);
  story.BindExternalFunction('skillCheck', (skillId: string, threshold: number) =>
    get().skillCheck(skillId, threshold)
  );
  story.BindExternalFunction('triggerMonologue', (skillId: string, threshold: number, line: string) =>
    get().triggerMonologue(skillId, threshold, line)
  );
  story.BindExternalFunction('grantSkill', (skillId: string) =>
    get().grantSkill(skillId)
  );
  story.BindExternalFunction('removeSkill', (skillId: string) =>
    get().removeSkill(skillId)
  );
  story.BindExternalFunction('setEmotion', (characterId: string, emotion: string) =>
    get().setCharacterEmotion(characterId, emotion)
  );
  story.BindExternalFunction('setFlag', (key: string, value: number) =>
    get().setFlag(key, value)
  );
  story.BindExternalFunction('getFlag', (key: string) => {
    const val = get().flags[key];
    if (val === undefined || val === false || val === 0) return 0;
    return 1;
  });
  story.BindExternalFunction('giveItem', (itemId: string) =>
    get().giveItem(itemId)
  );
  story.ChoosePathString(knotId);
  return story;
}

export const useGameStore = create<GameStore>((set, get) => ({
  skills: INITIAL_SKILLS,
  inventory: INITIAL_INVENTORY,
  flags: {},
  story: null,
  checkHistory: [],
  pendingCheck: null,
  panelLog: [],
  scenes: SCENES,
  currentSceneId: 'office',
  activeCharacterId: null,
  currentKnotId: null,
  visitedChoices: {},
  characterEmotions: {},

  openDialogue: (knotId) => {
    set({ story: makeStory(get, knotId), panelLog: [], currentKnotId: knotId });
  },

  openCharacterDialogue: (characterId, knotId) => {
    set({ story: makeStory(get, knotId), panelLog: [], activeCharacterId: characterId, currentKnotId: knotId });
  },

  closeDialogue: () => set({ story: null, activeCharacterId: null }),

  addStoryLine: (text) =>
    set(state => ({
      panelLog: [...state.panelLog, { type: 'story', id: ++nextId, text }],
    })),

  clearPendingCheck: () => set({ pendingCheck: null }),

  navigateTo: (sceneId) => set({ currentSceneId: sceneId, story: null, panelLog: [] }),

  setFlag: (key, value) =>
    set(state => ({ flags: { ...state.flags, [key]: value } })),

  addItem: (item) =>
    set(state => ({ inventory: [...state.inventory, item] })),

  giveItem: (itemId) => {
    const template = ITEM_CATALOG[itemId];
    if (!template) return;
    set(state => {
      if (state.inventory.some(i => i.id === itemId)) return state;
      return { inventory: [...state.inventory, { ...template }] };
    });
  },

  equipItem: (itemId, slot) =>
    set(state => {
      const item = state.inventory.find(i => i.id === itemId);
      if (!item || !item.allowedSlots.includes(slot)) return state;
      return {
        inventory: state.inventory.map(i => {
          if (i.id === itemId)  return { ...i, slot };
          if (i.slot === slot)  return { ...i, slot: null }; // evict previous occupant
          return i;
        }),
      };
    }),

  unequipItem: (itemId) =>
    set(state => ({
      inventory: state.inventory.map(i =>
        i.id === itemId ? { ...i, slot: null } : i
      ),
    })),

  markChoiceVisited: (key) =>
    set(state => ({ visitedChoices: { ...state.visitedChoices, [key]: true } })),

  setCharacterEmotion: (characterId, emotion) =>
    set(state => ({ characterEmotions: { ...state.characterEmotions, [characterId]: emotion } })),

  grantSkill: (skillId) =>
    set(state => ({
      skills: state.skills.map(s => s.id === skillId ? { ...s, discovered: true } : s),
    })),

  removeSkill: (skillId) =>
    set(state => ({
      skills: state.skills.map(s => s.id === skillId ? { ...s, discovered: false } : s),
    })),

  skillCheck: (skillId, threshold) => {
    const { skills, inventory } = get();
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return 0;

    const bonuses = computeEquippedBonuses(inventory);
    const effectiveStat = skill.baseStat + (bonuses[skillId] ?? 0);
    const roll = Math.ceil(Math.random() * 10);
    const passed = roll + effectiveStat >= threshold;

    const result: SkillCheckResult = {
      skillId, label: skill.label, roll, effectiveStat, threshold, passed,
    };

    set(state => ({
      pendingCheck: result,
      checkHistory: [...state.checkHistory, [result]],
    }));

    return passed ? 1 : 0;
  },

  triggerMonologue: (skillId, threshold, line) => {
    const { skills, inventory } = get();
    const skill = skills.find(s => s.id === skillId);
    if (!skill || !skill.discovered) return 0;

    const bonuses = computeEquippedBonuses(inventory);
    const effectiveStat = skill.baseStat + (bonuses[skillId] ?? 0);
    const roll = Math.ceil(Math.random() * 10);
    const passed = roll + effectiveStat >= threshold;

    if (passed) {
      set(state => ({
        panelLog: [...state.panelLog, {
          type: 'monologue',
          id: ++nextId,
          skillId,
          label: skill.label,
          threshold,
          line,
          color: skill.color,
        }],
      }));
    }

    return passed ? 1 : 0;
  },

  triggerCheck: (threshold) => {
    const { skills, inventory } = get();
    const bonuses = computeEquippedBonuses(inventory);

    const results: SkillCheckResult[] = skills.map(skill => {
      const effectiveStat = skill.baseStat + (bonuses[skill.id] ?? 0);
      const roll = Math.ceil(Math.random() * 10);
      return {
        skillId: skill.id,
        label: skill.label,
        roll,
        effectiveStat,
        threshold,
        passed: roll + effectiveStat >= threshold,
      };
    });

    set(state => ({ checkHistory: [...state.checkHistory, results] }));
    return results;
  },

  saveGame: () => {
    const { currentSceneId, flags, inventory, visitedChoices, skills } = get();
    const slots: Partial<Record<SlotId, string>> = {};
    for (const item of inventory) {
      if (item.slot) slots[item.slot] = item.id;
    }
    const discoveredSkills = skills.filter(s => s.discovered).map(s => s.id);
    const acquiredItems    = inventory.filter(i => ITEM_CATALOG[i.id]).map(i => i.id);
    const data: SaveData = { v: 2, ts: Date.now(), sceneId: currentSceneId, flags, slots, visitedChoices, discoveredSkills, acquiredItems };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  },

  loadGame: () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw) as SaveData;
      if (data.v !== 2) return false;
      const slotByItem = Object.fromEntries(
        Object.entries(data.slots).map(([slot, id]) => [id, slot as SlotId])
      );
      set(state => ({
        currentSceneId: data.sceneId,
        flags: data.flags,
        visitedChoices: data.visitedChoices ?? {},
        inventory: (() => {
          const base = state.inventory.filter(i => !ITEM_CATALOG[i.id]);
          const acquired = (data.acquiredItems ?? [])
            .map(id => ITEM_CATALOG[id])
            .filter(Boolean)
            .map(template => ({ ...template, slot: slotByItem[template.id] ?? null }));
          return [...base, ...acquired];
        })(),
        skills: data.discoveredSkills
          ? state.skills.map(s => ({ ...s, discovered: data.discoveredSkills!.includes(s.id) }))
          : state.skills,
        story: null,
        panelLog: [],
      }));
      return true;
    } catch {
      return false;
    }
  },

  hasSave: () => localStorage.getItem(SAVE_KEY) !== null,
}));
