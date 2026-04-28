import { useGameStore, type InventoryItem, type SlotId } from '../store/gameStore';
import './InventoryPanel.css';

const SLOTS: { id: SlotId; label: string }[] = [
  { id: 'left_hand',  label: 'LEFT HAND'  },
  { id: 'right_hand', label: 'RIGHT HAND' },
  { id: 'headgear',   label: 'HEADGEAR'   },
  { id: 'pocket',     label: 'POCKET'     },
];

function BonusPills({ bonuses, colorMap, discoveredIds }: {
  bonuses: InventoryItem['statBonuses'];
  colorMap: Record<string, string>;
  discoveredIds: Set<string>;
}) {
  const visible = Object.entries(bonuses).filter(([skillId]) => discoveredIds.has(skillId));
  if (visible.length === 0) return null;
  return (
    <div className="item-bonuses">
      {visible.map(([skillId, bonus]) => (
        <span
          key={skillId}
          className="item-bonus-pill"
          style={{ color: colorMap[skillId] ?? '#888', borderColor: colorMap[skillId] ?? '#888' }}
        >
          +{bonus} {skillId.toUpperCase()}
        </span>
      ))}
    </div>
  );
}

function SlotCard({ label, item, colorMap, discoveredIds }: {
  label: string;
  item: InventoryItem | undefined;
  colorMap: Record<string, string>;
  discoveredIds: Set<string>;
}) {
  const unequipItem = useGameStore(s => s.unequipItem);

  return (
    <div className={`slot-card ${item ? 'filled' : ''}`}>
      <div className="slot-label">{label}</div>
      {item ? (
        <>
          <div className="slot-item-name">{item.label}</div>
          <div className="slot-footer">
            <BonusPills bonuses={item.statBonuses} colorMap={colorMap} discoveredIds={discoveredIds} />
            <button className="slot-unequip-btn" onClick={() => unequipItem(item.id)}>×</button>
          </div>
        </>
      ) : (
        <div className="slot-empty">empty</div>
      )}
    </div>
  );
}

function ItemCard({ item, colorMap, discoveredIds }: { item: InventoryItem; colorMap: Record<string, string>; discoveredIds: Set<string> }) {
  const equipItem = useGameStore(s => s.equipItem);

  return (
    <div className={`item-card ${item.slot ? 'equipped' : ''}`}>
      <div className="item-header">
        <span className="item-label">{item.label}</span>
        {item.slot && (
          <span className="item-slot-badge">
            {SLOTS.find(s => s.id === item.slot)?.label}
          </span>
        )}
      </div>
      <p className="item-description">{item.description}</p>
      <div className="item-footer">
        <BonusPills bonuses={item.statBonuses} colorMap={colorMap} discoveredIds={discoveredIds} />
        <div className="item-slot-btns">
          {SLOTS.map(slot => {
            const allowed = item.allowedSlots.includes(slot.id);
            return (
              <button
                key={slot.id}
                className={`item-slot-btn ${item.slot === slot.id ? 'active' : ''} ${!allowed ? 'forbidden' : ''}`}
                onClick={allowed ? () => equipItem(item.id, slot.id) : undefined}
                disabled={!allowed}
                title={allowed ? slot.label : `Cannot equip in ${slot.label}`}
              >
                {slot.label[0]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function InventoryPanel() {
  const inventory = useGameStore(s => s.inventory);
  const skills    = useGameStore(s => s.skills);
  const colorMap     = Object.fromEntries(skills.map(s => [s.id, s.color]));
  const discoveredIds = new Set(skills.filter(s => s.discovered).map(s => s.id));

  const itemBySlot = Object.fromEntries(
    inventory.filter(i => i.slot).map(i => [i.slot!, i])
  );

  return (
    <div className="inventory-panel">
      <div className="inventory-label">◈ EQUIPPED</div>
      <div className="slot-grid">
        {SLOTS.map(slot => (
          <SlotCard
            key={slot.id}
            label={slot.label}
            item={itemBySlot[slot.id]}
            colorMap={colorMap}
            discoveredIds={discoveredIds}
          />
        ))}
      </div>
      <div className="inventory-label items-label">◈ ITEMS</div>
      <div className="inventory-list">
        {inventory.map(item => (
          <ItemCard key={item.id} item={item} colorMap={colorMap} discoveredIds={discoveredIds} />
        ))}
      </div>
    </div>
  );
}
