import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Download, Upload, Trash2, Eye } from 'lucide-react';
import * as OBC from '@thatopen/components';
import * as THREE from 'three';
import { v4 as uuid } from 'uuid';
import { useBIM } from '../../../context/BIMContext';
import {
  getSmartViews,
  saveSmartView,
  deleteSmartView,
} from '../../../services/smartViewsService';
import type { SmartView } from '../../../types/bim';

interface SmartViewsPanelProps {
  projectId: string;
}

const SmartViewsPanel = ({ projectId }: SmartViewsPanelProps) => {
  const {
    getComponents,
    getWorld,
    selectedItems,
    colorizations,
    setSelectedItems,
    setColorizations,
    setItemsColor,
  } = useBIM();

  const [views, setViews] = useState<SmartView[]>([]);
  const [newViewName, setNewViewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ----------------------------------------------------------------
  // Load views from Firebase on mount
  // ----------------------------------------------------------------
  const loadViews = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetched = await getSmartViews(projectId);
      setViews(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load views');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadViews();
  }, [loadViews]);

  // ----------------------------------------------------------------
  // Capture current state as a SmartView
  // ----------------------------------------------------------------
  const captureCurrentState = (): SmartView | null => {
    const components = getComponents();
    const world = getWorld();
    if (!components || !world) return null;

    // Camera position + target
    const cam = world.camera.three;
    const pos = cam.position;
    const target = world.camera.controls.getTarget(new THREE.Vector3());

    // Queries from ItemsFinder
    const finder = components.get(OBC.ItemsFinder);
    const exported = finder.export();

    return {
      id: uuid(),
      name: newViewName.trim() || 'Smart View',
      projectId,
      camera: {
        position: [pos.x, pos.y, pos.z],
        target: [target.x, target.y, target.z],
      },
      queries: exported.data,
      colorizations: colorizations.map(c => ({
        ...c,
        localIds: [...c.localIds],
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // ----------------------------------------------------------------
  // Create a new smart view
  // ----------------------------------------------------------------
  const handleCreate = async () => {
    if (!newViewName.trim()) {
      setError('Enter a name for the smart view.');
      return;
    }
    const view = captureCurrentState();
    if (!view) { setError('BIM viewer not ready.'); return; }

    setIsLoading(true);
    setError('');
    try {
      await saveSmartView(view);
      setViews(prev => [...prev, view]);
      setNewViewName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // Update an existing smart view with current state
  // ----------------------------------------------------------------
  const handleUpdate = async (view: SmartView) => {
    const components = getComponents();
    const world = getWorld();
    if (!components || !world) return;

    const cam = world.camera.three;
    const pos = cam.position;
    const target = world.camera.controls.getTarget(new THREE.Vector3());
    const finder = components.get(OBC.ItemsFinder);
    const exported = finder.export();

    const updated: SmartView = {
      ...view,
      camera: {
        position: [pos.x, pos.y, pos.z],
        target: [target.x, target.y, target.z],
      },
      queries: exported.data,
      colorizations: colorizations.map(c => ({ ...c, localIds: [...c.localIds] })),
      updatedAt: new Date().toISOString(),
    };

    setIsLoading(true);
    try {
      await saveSmartView(updated);
      setViews(prev => prev.map(v => (v.id === updated.id ? updated : v)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // Apply a smart view — restore camera, queries, colorizations
  // ----------------------------------------------------------------
  const handleApply = async (view: SmartView) => {
    const components = getComponents();
    const world = getWorld();
    if (!components || !world) return;

    setIsLoading(true);
    setError('');
    try {
      // Restore camera
      const [px, py, pz] = view.camera.position;
      const [tx, ty, tz] = view.camera.target;
      await world.camera.controls.setLookAt(px, py, pz, tx, ty, tz, true);

      // Restore queries into ItemsFinder
      const finder = components.get(OBC.ItemsFinder);
      if (view.queries.length > 0) {
        finder.import({ data: view.queries });
      }

      // Restore colorizations
      if (view.colorizations.length > 0) {
        const newColorizations = view.colorizations.map(c => ({
          ...c,
          localIds: [...c.localIds],
        }));
        setColorizations(newColorizations);

        for (const c of view.colorizations) {
          const modelIdMap: OBC.ModelIdMap = {
            [c.modelId]: new Set(c.localIds),
          };
          await setItemsColor(modelIdMap, c.color);
        }
      }

      // Select items from queries
      if (view.queries.length > 0) {
        const allItems: OBC.ModelIdMap = {};
        for (const q of finder.list.values()) {
          const found = await finder.getItems(q.queries);
          for (const [mid, ids] of Object.entries(found)) {
            const existing = allItems[mid] ?? new Set<number>();
            for (const id of ids) existing.add(id);
            allItems[mid] = existing;
          }
        }
        if (Object.keys(allItems).length > 0) {
          await setSelectedItems(allItems);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Apply failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // Delete a smart view
  // ----------------------------------------------------------------
  const handleDelete = async (view: SmartView) => {
    setIsLoading(true);
    try {
      await deleteSmartView(projectId, view.id);
      setViews(prev => prev.filter(v => v.id !== view.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // Export all views to JSON
  // ----------------------------------------------------------------
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(views, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-views-${projectId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ----------------------------------------------------------------
  // Import views from JSON
  // ----------------------------------------------------------------
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string) as SmartView[];
        const toSave = parsed.map(v => ({ ...v, projectId }));
        setIsLoading(true);
        for (const v of toSave) {
          await saveSmartView(v);
        }
        setViews(prev => {
          const ids = new Set(prev.map(v => v.id));
          return [...prev, ...toSave.filter(v => !ids.has(v.id))];
        });
      } catch {
        setError('Invalid JSON file.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Context info */}
      <p className="text-xs text-slate-400">
        Smart views save camera position, active queries, and colorizations to
        Firebase. Click <strong className="text-white">Apply</strong> to restore
        a view.
      </p>
      {selectedItems && Object.keys(selectedItems).length > 0 && (
        <p className="text-xs text-brand">
          Current selection will be included when applying a view.
        </p>
      )}

      {/* Create new */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newViewName}
          onChange={e => setNewViewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') void handleCreate(); }}
          placeholder="New view name…"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <button
          onClick={() => void handleCreate()}
          disabled={isLoading || !newViewName.trim()}
          className="px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors"
          title="Create smart view"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <p className="text-xs text-rose-400 bg-rose-400/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Views list */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
        {isLoading && views.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">Loading…</p>
        )}
        {!isLoading && views.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            No smart views yet.
          </p>
        )}
        {views.map(view => (
          <div
            key={view.id}
            className="bg-slate-800 rounded-xl px-3 py-2.5 flex items-center gap-2"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {view.name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {view.queries.length} quer{view.queries.length === 1 ? 'y' : 'ies'}{' '}
                · {view.colorizations.length} color{view.colorizations.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => void handleApply(view)}
              className="text-slate-400 hover:text-brand"
              title="Apply view"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => void handleUpdate(view)}
              className="text-slate-400 hover:text-emerald-400"
              title="Update with current state"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => void handleDelete(view)}
              className="text-slate-400 hover:text-rose-400"
              title="Delete view"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Export / Import */}
      <div className="mt-auto border-t border-slate-700 pt-3 flex gap-2">
        <button
          onClick={handleExport}
          disabled={views.length === 0}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-slate-200 text-sm rounded-lg hover:bg-slate-600 disabled:opacity-40 transition-colors"
        >
          <Download className="w-4 h-4" /> Export JSON
        </button>
        <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-slate-200 text-sm rounded-lg hover:bg-slate-600 transition-colors cursor-pointer">
          <Upload className="w-4 h-4" /> Import JSON
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </label>
      </div>
    </div>
  );
};

export default SmartViewsPanel;
