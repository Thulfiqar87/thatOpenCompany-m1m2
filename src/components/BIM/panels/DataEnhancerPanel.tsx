import { useState } from 'react';
import { Users } from 'lucide-react';
import * as OBC from '@thatopen/components';
import type { ModelIdMap } from '@thatopen/components';
import type { ItemData } from '@thatopen/fragments';
import { useBIM } from '../../../context/BIMContext';

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/** Recursively flatten an ItemData tree into a list of { key, value } pairs */
function flattenItemData(
  data: ItemData,
  prefix = '',
): { key: string; value: string }[] {
  const rows: { key: string; value: string }[] = [];
  for (const [k, v] of Object.entries(data)) {
    const fullKey = prefix ? `${prefix} / ${k}` : k;
    if (Array.isArray(v)) {
      for (const child of v) {
        rows.push(...flattenItemData(child as ItemData, fullKey));
      }
    } else if (v !== null && typeof v === 'object' && 'value' in v) {
      rows.push({ key: fullKey, value: String((v as { value: unknown }).value ?? '') });
    } else {
      rows.push({ key: fullKey, value: String(v) });
    }
  }
  return rows;
}

/** Group all rows by their value */
function groupByValue(rows: { key: string; value: string }[]) {
  const map = new Map<string, { key: string; value: string }[]>();
  for (const r of rows) {
    const existing = map.get(r.value) ?? [];
    existing.push(r);
    map.set(r.value, existing);
  }
  return map;
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
const DataEnhancerPanel = () => {
  const { selectedItems, getComponents, setSelectedItems } = useBIM();

  const [itemRows, setItemRows] = useState<{ key: string; value: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [similarTarget, setSimilarTarget] = useState<{
    key: string;
    value: string;
  } | null>(null);

  const hasSelection = Object.values(selectedItems).some(s => s.size > 0);

  // ----------------------------------------------------------------
  // Load data for the current selection
  // ----------------------------------------------------------------
  const handleLoadData = async () => {
    const components = getComponents();
    if (!components || !hasSelection) return;

    setIsLoading(true);
    setError('');
    setSimilarTarget(null);

    try {
      const fm = components.get(OBC.FragmentsManager);
      const allData = await fm.getData(selectedItems);

      const rows: { key: string; value: string }[] = [];
      for (const items of Object.values(allData)) {
        for (const item of items) {
          rows.push(...flattenItemData(item));
        }
      }
      setItemRows(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // Find all items sharing the same property value
  // ----------------------------------------------------------------
  const handleFindSimilar = async (key: string, value: string) => {
    const components = getComponents();
    if (!components) return;

    setSimilarTarget({ key, value });
    setIsLoading(true);
    setError('');

    try {
      const fm = components.get(OBC.FragmentsManager);
      const matched: ModelIdMap = {};

      // Extract just the attribute name (strip pset prefix)
      const attrName = key.split(' / ').pop() ?? key;

      for (const model of fm.list.values()) {
        const ids = await model.getItemsByQuery({
          attributes: {
            queries: [
              {
                name: new RegExp(`^${escapeRegex(attrName)}$`, 'i'),
                value: new RegExp(`^${escapeRegex(value)}$`, 'i'),
              },
            ],
          },
        });
        if (ids.length > 0) {
          matched[model.modelId] = new Set(ids);
        }
      }

      const total = Object.values(matched).reduce((s, set) => s + set.size, 0);
      if (total > 0) {
        await setSelectedItems(matched);
      } else {
        setError(`No items found sharing "${attrName} = ${value}"`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Find similar failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <div className="flex flex-col h-full gap-4">
      {!hasSelection ? (
        <div className="bg-slate-800 rounded-xl px-4 py-3">
          <p className="text-sm text-slate-400">
            Click an item in the viewer to select it, then load its data.
          </p>
        </div>
      ) : (
        <button
          onClick={handleLoadData}
          disabled={isLoading}
          className="w-full px-3 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Loading…' : 'Load Selected Item Data'}
        </button>
      )}

      {error && (
        <p className="text-xs text-rose-400 bg-rose-400/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Property table */}
      {itemRows.length > 0 && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Properties ({itemRows.length})
          </p>
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-900">
              <tr>
                <th className="text-left text-slate-500 pb-1 font-medium">
                  Property
                </th>
                <th className="text-left text-slate-500 pb-1 font-medium">
                  Value
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {itemRows.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-slate-800 hover:bg-slate-800/50 ${
                    similarTarget?.key === row.key &&
                    similarTarget?.value === row.value
                      ? 'bg-brand/10'
                      : ''
                  }`}
                >
                  <td className="py-1 pr-2 text-slate-400 truncate max-w-[130px]">
                    {row.key}
                  </td>
                  <td className="py-1 pr-2 text-white truncate max-w-[110px]">
                    {row.value}
                  </td>
                  <td className="py-1">
                    {row.value && (
                      <button
                        onClick={() => handleFindSimilar(row.key, row.value)}
                        className="text-slate-500 hover:text-brand"
                        title="Find all items with this value"
                      >
                        <Users className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Group-by-value summary */}
      {itemRows.length > 0 && (
        <div className="border-t border-slate-700 pt-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Values Overview
          </p>
          <ul className="space-y-1 max-h-32 overflow-y-auto text-xs">
            {Array.from(groupByValue(itemRows).entries())
              .filter(([v]) => v.trim())
              .slice(0, 20)
              .map(([v, rows]) => (
                <li
                  key={v}
                  className="flex items-center gap-2 text-slate-300"
                >
                  <span className="flex-1 truncate">{v}</span>
                  <span className="text-slate-500">{rows.length}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default DataEnhancerPanel;
