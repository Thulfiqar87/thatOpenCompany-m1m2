import { RotateCcw } from 'lucide-react';
import { useBIM } from '../../../context/BIMContext';

const PALETTE: { label: string; hex: string }[] = [
  { label: 'Blue',    hex: '#3b82f6' },
  { label: 'Red',     hex: '#ef4444' },
  { label: 'Green',   hex: '#22c55e' },
  { label: 'Yellow',  hex: '#eab308' },
  { label: 'Orange',  hex: '#f97316' },
  { label: 'Purple',  hex: '#a855f7' },
  { label: 'Pink',    hex: '#ec4899' },
  { label: 'Cyan',    hex: '#06b6d4' },
  { label: 'Lime',    hex: '#84cc16' },
  { label: 'Amber',   hex: '#f59e0b' },
  { label: 'Teal',    hex: '#14b8a6' },
  { label: 'White',   hex: '#f1f5f9' },
];

const ColorsPalettePanel = () => {
  const {
    selectedItems,
    colorizations,
    setItemsColor,
    resetItemsColor,
  } = useBIM();

  const hasSelection = Object.values(selectedItems).some(s => s.size > 0);
  const selectedCount = Object.values(selectedItems).reduce(
    (acc, s) => acc + s.size,
    0,
  );

  const handleColorClick = async (hex: string) => {
    if (!hasSelection) return;
    await setItemsColor(selectedItems, hex);
  };

  const handleResetSelected = async () => {
    if (!hasSelection) return;
    await resetItemsColor(selectedItems);
  };

  const handleResetAll = async () => {
    await resetItemsColor();
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Selection status */}
      <div className="bg-slate-800 rounded-xl px-4 py-3">
        {hasSelection ? (
          <p className="text-sm text-white">
            <span className="font-bold text-brand">{selectedCount}</span> item
            {selectedCount !== 1 ? 's' : ''} selected
          </p>
        ) : (
          <p className="text-sm text-slate-400">
            Click an item in the viewer to select it, then pick a color below.
          </p>
        )}
      </div>

      {/* Color grid */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Color Palette
        </p>
        <div className="grid grid-cols-4 gap-2">
          {PALETTE.map(({ label, hex }) => (
            <button
              key={hex}
              onClick={() => handleColorClick(hex)}
              disabled={!hasSelection}
              title={label}
              className="group relative aspect-square rounded-xl border-2 border-transparent hover:border-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              style={{ backgroundColor: hex }}
            >
              <span className="absolute inset-0 flex items-end justify-center pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[9px] font-bold text-white drop-shadow">
                  {label}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Active colorizations */}
      {colorizations.length > 0 && (
        <div className="border-t border-slate-700 pt-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Applied Colors
          </p>
          <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {colorizations.map((c, i) => (
              <li
                key={`${c.modelId}-${c.color}-${i}`}
                className="flex items-center gap-2 text-xs text-slate-300"
              >
                <span
                  className="w-4 h-4 rounded-full shrink-0 border border-slate-600"
                  style={{ backgroundColor: c.color }}
                />
                <span className="truncate flex-1">
                  {c.localIds.length} item{c.localIds.length !== 1 ? 's' : ''}{' '}
                  — model {c.modelId.slice(0, 8)}…
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reset actions */}
      <div className="mt-auto border-t border-slate-700 pt-3 flex flex-col gap-2">
        <button
          onClick={handleResetSelected}
          disabled={!hasSelection}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-slate-200 text-sm rounded-lg hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Reset Selection Color
        </button>
        <button
          onClick={handleResetAll}
          disabled={colorizations.length === 0}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-rose-900/40 text-rose-300 text-sm rounded-lg hover:bg-rose-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Reset All Colors
        </button>
      </div>
    </div>
  );
};

export default ColorsPalettePanel;
