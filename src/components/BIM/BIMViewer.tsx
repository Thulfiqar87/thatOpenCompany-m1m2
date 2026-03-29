import { useRef, useEffect, useState } from 'react';
import * as OBC from '@thatopen/components';
import * as THREE from 'three';
import {
  Search,
  Palette,
  Database,
  Layers,
  Upload,
  X,
  Loader2,
} from 'lucide-react';
import { useBIM } from '../../context/BIMContext';
import ItemsFinderPanel from './panels/ItemsFinderPanel';
import ColorsPalettePanel from './panels/ColorsPalettePanel';
import DataEnhancerPanel from './panels/DataEnhancerPanel';
import SmartViewsPanel from './panels/SmartViewsPanel';
import ViewCube from './ViewCube';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
type PanelId = 'finder' | 'colors' | 'data' | 'smart';

interface ToolbarBtn {
  id: PanelId;
  icon: React.ReactNode;
  label: string;
}

const TOOLBAR_BTNS: ToolbarBtn[] = [
  { id: 'finder', icon: <Search className="w-5 h-5" />,  label: 'Items Finder'   },
  { id: 'colors', icon: <Palette className="w-5 h-5" />, label: 'Colors Palette' },
  { id: 'data',   icon: <Database className="w-5 h-5" />,label: 'Data Enhancer'  },
  { id: 'smart',  icon: <Layers className="w-5 h-5" />,  label: 'Smart Views'    },
];

interface BIMViewerProps {
  projectId: string;
}

// ------------------------------------------------------------------
// BIMViewer
// ------------------------------------------------------------------
const BIMViewer = ({ projectId }: BIMViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const {
    initWorld,
    disposeWorld,
    clearModels,
    loadIFC,
    isInitialized,
    initError,
    loadedModels,
    selectedItems,
    setSelectedItems,
    clearSelection,
    getComponents,
    getWorld,
  } = useBIM();

  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [isLoadingIFC, setIsLoadingIFC] = useState(false);
  const [loadError, setLoadError] = useState('');

  // ----------------------------------------------------------------
  // Init / dispose world on mount / unmount
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;
    void initWorld(containerRef.current);
    return () => { disposeWorld(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear models when projectId changes
  useEffect(() => {
    void clearModels();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ----------------------------------------------------------------
  // IFC file upload
  // ----------------------------------------------------------------
  const handleIFCUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoadingIFC(true);
    setLoadError('');
    try {
      await loadIFC(file);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load IFC file');
    } finally {
      setIsLoadingIFC(false);
    }
    e.target.value = '';
  };

  // ----------------------------------------------------------------
  // Click-to-select — distinguish click vs drag
  // ----------------------------------------------------------------
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (!mouseDownPos.current) return;
    const dx = Math.abs(e.clientX - mouseDownPos.current.x);
    const dy = Math.abs(e.clientY - mouseDownPos.current.y);
    mouseDownPos.current = null;
    if (dx < 5 && dy < 5) {
      await handleItemClick(e.nativeEvent);
    }
  };

  const handleItemClick = async (e: MouseEvent) => {
    const components = getComponents();
    const world = getWorld();
    if (!components || !world || !world.renderer) return;

    const fm = components.get(OBC.FragmentsManager);
    const canvas = world.renderer.three.domElement;

    // fragments.raycast expects raw pixel coords (clientX/Y), not NDC
    const mouse = new THREE.Vector2(e.clientX, e.clientY);

    const camThree = world.camera.three;
    if (
      !(camThree instanceof THREE.PerspectiveCamera) &&
      !(camThree instanceof THREE.OrthographicCamera)
    ) return;

    const result = await fm.raycast({ camera: camThree, mouse, dom: canvas });
    const additive = e.ctrlKey || e.metaKey;

    if (result) {
      const modelId = result.fragments.modelId;
      if (additive) {
        // Merge with existing selection; toggle off if already selected
        const existing = new Set(selectedItems[modelId] ?? []);
        if (existing.has(result.localId)) {
          existing.delete(result.localId);
        } else {
          existing.add(result.localId);
        }
        const merged: OBC.ModelIdMap = { ...selectedItems, [modelId]: existing };
        await setSelectedItems(merged);
      } else {
        await setSelectedItems({ [modelId]: new Set([result.localId]) });
      }
    } else if (!additive) {
      await clearSelection();
    }
  };

  // ----------------------------------------------------------------
  // Panel toggle
  // ----------------------------------------------------------------
  const togglePanel = (id: PanelId) => {
    setActivePanel(prev => (prev === id ? null : id));
  };

  // ----------------------------------------------------------------
  // Panel title
  // ----------------------------------------------------------------
  const panelTitle =
    TOOLBAR_BTNS.find(b => b.id === activePanel)?.label ?? '';

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    // Fixed overlay: fills area from sidebar (260px) + header (6rem) to viewport edges
    <div
      className="fixed bg-slate-950 overflow-hidden"
      style={{ left: '260px', top: '6rem', right: 0, bottom: 0 }}
    >
      {/* ── 3D Canvas container ────────────────────────────────── */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseUp={e => { void handleMouseUp(e); }}
      />

      {/* ── Loading spinner / error while initializing ──────────── */}
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-30">
          {initError ? (
            <div className="text-center px-6">
              <p className="text-rose-400 font-semibold mb-1">BIM viewer failed to initialize</p>
              <p className="text-slate-400 text-sm font-mono">{initError}</p>
            </div>
          ) : (
            <Loader2 className="w-10 h-10 text-brand animate-spin" />
          )}
        </div>
      )}

      {/* ── View cube ────────────────────────────────────────────── */}
      {isInitialized && <ViewCube />}

      {/* ── Bottom-center: IFC upload ─────────────────────────────── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
        {loadError && (
          <span className="text-xs text-rose-400 bg-rose-400/10 rounded-lg px-3 py-2 max-w-xs truncate">
            {loadError}
          </span>
        )}
        <label className="flex items-center gap-2 px-6 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-dark transition-colors cursor-pointer shadow-lg shadow-brand/20">
          {isLoadingIFC ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {isLoadingIFC ? 'Loading…' : 'Load IFC'}
          <input
            type="file"
            accept=".ifc"
            className="hidden"
            onChange={e => { void handleIFCUpload(e); }}
          />
        </label>
      </div>

      {/* ── Left toolbar ─────────────────────────────────────────── */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
        {TOOLBAR_BTNS.map(btn => (
          <button
            key={btn.id}
            onClick={() => togglePanel(btn.id)}
            title={btn.label}
            className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-all ${
              activePanel === btn.id
                ? 'bg-brand text-white border-brand shadow-lg shadow-brand/30'
                : 'bg-slate-800/80 backdrop-blur border-slate-700 text-brand hover:text-white hover:bg-slate-700'
            }`}
          >
            {btn.icon}
          </button>
        ))}
      </div>

      {/* ── Side panel ───────────────────────────────────────────── */}
      {activePanel && (
        <div className="absolute left-16 top-4 bottom-4 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-20 overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
            <h2 className="text-sm font-bold text-white">{panelTitle}</h2>
            <button
              onClick={() => setActivePanel(null)}
              className="text-brand hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Panel body */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {activePanel === 'finder' && <ItemsFinderPanel />}
            {activePanel === 'colors' && <ColorsPalettePanel />}
            {activePanel === 'data'   && <DataEnhancerPanel />}
            {activePanel === 'smart'  && (
              <SmartViewsPanel projectId={projectId} />
            )}
          </div>
        </div>
      )}

      {/* ── Empty state overlay ──────────────────────────────────── */}
      {isInitialized && loadedModels.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="bg-slate-900/70 backdrop-blur rounded-2xl px-8 py-6 text-center border border-slate-700/50">
            <p className="text-slate-300 font-medium mb-1">No model loaded</p>
            <p className="text-slate-500 text-sm">
              Click <span className="text-brand font-semibold">Load IFC</span> to
              open a model
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BIMViewer;
