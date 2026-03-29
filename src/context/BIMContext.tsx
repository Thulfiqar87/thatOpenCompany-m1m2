import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
} from 'react';
import * as OBC from '@thatopen/components';
import * as THREE from 'three';
import { RenderedFaces } from '@thatopen/fragments';
import type { FragmentsModel } from '@thatopen/fragments';
import type { ModelIdMap } from '@thatopen/components';
import type { ColorEntry } from '../types/bim';

// Vite resolves this to the bundled worker URL
import fragmentsWorkerUrl from '@thatopen/fragments/worker?url';

// ------------------------------------------------------------------
// Selection highlight material (blue, semi-transparent)
// ------------------------------------------------------------------
const SELECTION_MATERIAL = {
  color: new THREE.Color(0x2563eb),
  renderedFaces: RenderedFaces.TWO,
  opacity: 0.6,
  transparent: true,
};

// Ghost material for non-isolated items (dark, barely visible)
const ISOLATION_GHOST_MATERIAL = {
  color: new THREE.Color(0x0f172a),
  renderedFaces: RenderedFaces.TWO,
  opacity: 0.06,
  transparent: true,
};

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
type BIMWorld = OBC.SimpleWorld<
  OBC.SimpleScene,
  OBC.SimpleCamera,
  OBC.SimpleRenderer
>;

interface BIMContextType {
  isInitialized: boolean;
  initError: string | null;
  loadedModels: FragmentsModel[];
  selectedItems: ModelIdMap;
  colorizations: ColorEntry[];
  isIsolated: boolean;
  isHiding: boolean;
  initWorld: (container: HTMLElement) => Promise<void>;
  disposeWorld: () => void;
  clearModels: () => Promise<void>;
  loadIFC: (file: File) => Promise<void>;
  setSelectedItems: (items: ModelIdMap) => Promise<void>;
  clearSelection: () => Promise<void>;
  setItemsColor: (items: ModelIdMap, hexColor: string) => Promise<void>;
  resetItemsColor: (items?: ModelIdMap) => Promise<void>;
  setColorizations: (c: ColorEntry[]) => void;
  isolateItems: (items: ModelIdMap) => Promise<void>;
  exitIsolation: () => Promise<void>;
  hideItems: (items: ModelIdMap) => Promise<void>;
  showHiddenItems: () => Promise<void>;
  getComponents: () => OBC.Components | null;
  getWorld: () => BIMWorld | null;
}

const BIMContext = createContext<BIMContextType | undefined>(undefined);

// ------------------------------------------------------------------
// Provider
// ------------------------------------------------------------------
export const BIMProvider = ({ children }: { children: React.ReactNode }) => {
  // Singleton OBC.Components — created once per app lifetime
  const componentsRef = useRef<OBC.Components | null>(null);
  if (!componentsRef.current) {
    componentsRef.current = new OBC.Components();
  }

  const worldRef = useRef<BIMWorld | null>(null);
  const pendingWorldRef = useRef<BIMWorld | null>(null);
  const fragmentsInitRef = useRef(false);
  const ifcLoaderSetupRef = useRef(false);

  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [loadedModels, setLoadedModels] = useState<FragmentsModel[]>([]);
  const [selectedItems, setSelectedItemsState] = useState<ModelIdMap>({});
  const [colorizations, setColorizations] = useState<ColorEntry[]>([]);
  const [isIsolated, setIsIsolated] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  // Ref so callbacks always read the latest colorizations without stale closure
  const colorizationsRef = useRef<ColorEntry[]>([]);
  colorizationsRef.current = colorizations;

  // ----------------------------------------------------------------
  // initWorld — called by BIMViewer on mount
  // ----------------------------------------------------------------
  const initWorld = useCallback(async (container: HTMLElement) => {
    try {
    const components = componentsRef.current!;

    if (worldRef.current) {
      // Already exists — just reattach the canvas to the new container
      const renderer = worldRef.current.renderer;
      if (renderer) {
        const canvas = renderer.three.domElement;
        container.appendChild(canvas);
        renderer.container = container;
        renderer.resize();
      }
      setIsInitialized(true);
      return;
    }

    // Build the world
    const worlds = components.get(OBC.Worlds);
    const world = worlds.create<
      OBC.SimpleScene,
      OBC.SimpleCamera,
      OBC.SimpleRenderer
    >();

    world.scene = new OBC.SimpleScene(components);
    world.scene.setup();

    // Major grid — 5-unit spacing, clearly visible
    const majorGrid = new THREE.GridHelper(500, 100, 0x475569, 0x475569);
    for (const mat of (Array.isArray(majorGrid.material) ? majorGrid.material : [majorGrid.material])) {
      (mat as THREE.LineBasicMaterial).transparent = true;
      (mat as THREE.LineBasicMaterial).opacity = 0.55;
      (mat as THREE.LineBasicMaterial).depthWrite = false;
    }
    world.scene.three.add(majorGrid);

    // Minor grid — 1-unit spacing, subtle
    const minorGrid = new THREE.GridHelper(500, 500, 0x2d3748, 0x2d3748);
    for (const mat of (Array.isArray(minorGrid.material) ? minorGrid.material : [minorGrid.material])) {
      (mat as THREE.LineBasicMaterial).transparent = true;
      (mat as THREE.LineBasicMaterial).opacity = 0.25;
      (mat as THREE.LineBasicMaterial).depthWrite = false;
    }
    world.scene.three.add(minorGrid);

    // XYZ axes at origin — size matches typical building scale
    const axes = new THREE.AxesHelper(0.8);
    axes.renderOrder = 999;
    const axesMat = axes.material as THREE.LineBasicMaterial;
    axesMat.depthTest = false;
    axesMat.depthWrite = false;
    world.scene.three.add(axes);

    world.renderer = new OBC.SimpleRenderer(components, container);
    world.camera = new OBC.SimpleCamera(components);

    // Register as the in-progress world so disposeWorld can cancel us
    pendingWorldRef.current = world;

    // Init the FragmentsManager worker (once only)
    if (!fragmentsInitRef.current) {
      const fm = components.get(OBC.FragmentsManager);
      fm.init(fragmentsWorkerUrl);
      fragmentsInitRef.current = true;
    }

    // Setup IFC loader (once only) — use local WASM files to avoid CDN dependency
    if (!ifcLoaderSetupRef.current) {
      const ifcLoader = components.get(OBC.IfcLoader);
      ifcLoader.settings.autoSetWasm = false;
      ifcLoader.settings.wasm.path = '/wasm/';
      ifcLoader.settings.wasm.absolute = true;
      await ifcLoader.setup();
      ifcLoaderSetupRef.current = true;
    }

    // If disposeWorld was called while we were awaiting, bail out
    if (pendingWorldRef.current !== world) {
      world.renderer?.three.domElement.remove();
      return;
    }
    pendingWorldRef.current = null;

    // Start the render loop
    components.init();

    // Drive tile streaming on every rendered frame
    world.onAfterUpdate.add(() => {
      const fm = components.get(OBC.FragmentsManager);
      if (fm.initialized) {
        fm.core.update(false).catch(() => {});
      }
    });

    worldRef.current = world;
    setIsInitialized(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('BIM world initialization failed:', err);
      setInitError(msg);
    }
  }, []);

  // ----------------------------------------------------------------
  // disposeWorld — called by BIMViewer on unmount
  //   We keep the world alive and just detach the canvas so the render
  //   loop can resume on next mount without re-creating everything.
  // ----------------------------------------------------------------
  const disposeWorld = useCallback(() => {
    // Cancel any in-progress initialization (handles React StrictMode double-invoke)
    if (pendingWorldRef.current) {
      const pendingCanvas = pendingWorldRef.current.renderer?.three.domElement;
      pendingCanvas?.parentElement?.removeChild(pendingCanvas);
      pendingWorldRef.current = null;
    }
    if (!worldRef.current) return;
    const canvas = worldRef.current.renderer?.three.domElement;
    canvas?.parentElement?.removeChild(canvas);
    setIsInitialized(false);
  }, []);

  // ----------------------------------------------------------------
  // clearModels — remove all loaded models from the scene
  // ----------------------------------------------------------------
  const clearModels = useCallback(async () => {
    const components = componentsRef.current;
    const world = worldRef.current;
    if (!components || !world) return;

    const fm = components.get(OBC.FragmentsManager);
    const modelIds = [...fm.list.keys()];
    for (const modelId of modelIds) {
      const model = fm.list.get(modelId);
      if (model) world.scene.three.remove(model.object);
      await fm.core.disposeModel(modelId);
    }
    setLoadedModels([]);
    setSelectedItemsState({});
    setColorizations([]);
  }, []);

  // ----------------------------------------------------------------
  // loadIFC
  // ----------------------------------------------------------------
  const loadIFC = useCallback(async (file: File) => {
    const components = componentsRef.current;
    const world = worldRef.current;
    if (!components || !world) throw new Error('BIM not initialized');

    // Unload any previously loaded models before loading a new one
    const fm2 = components.get(OBC.FragmentsManager);
    const existingIds = [...fm2.list.keys()];
    for (const modelId of existingIds) {
      const m = fm2.list.get(modelId);
      if (m) world.scene.three.remove(m.object);
      await fm2.core.disposeModel(modelId);
    }

    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    const ifcLoader = components.get(OBC.IfcLoader);

    let model;
    try {
      model = await ifcLoader.load(uint8, true, file.name);
    } catch (e) {
      throw new Error(`IFC parse failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    world.scene.three.add(model.object);

    // Tell the model which camera to use for LOD / tile culling
    if (world.camera.three instanceof THREE.PerspectiveCamera) {
      model.useCamera(world.camera.three);
    }

    // Trigger initial tile streaming
    const fm = components.get(OBC.FragmentsManager);
    await fm.core.update(true);

    // Fit view to the new model
    try {
      const localIds = await model.getLocalIds();
      const modelIdMap: ModelIdMap = { [model.modelId]: new Set(localIds) };
      await world.camera.fitToItems(modelIdMap);
    } catch (e) {
      console.warn('fitToItems failed:', e);
    }

    // Trigger tile streaming again after camera repositioned
    await fm.core.update(true);

    setLoadedModels(prev => [...prev, model]);
  }, []);

  // ----------------------------------------------------------------
  // reapplyColorizations — call after resetHighlight to restore colors
  // resetHighlight wipes setColor state, so colors must be re-applied
  // ----------------------------------------------------------------
  const reapplyColorizations = useCallback(async (fm: OBC.FragmentsManager) => {
    for (const entry of colorizationsRef.current) {
      const model = fm.list.get(entry.modelId);
      if (model) {
        await model.setColor(entry.localIds, new THREE.Color(entry.color));
      }
    }
  }, []);

  // ----------------------------------------------------------------
  // setSelectedItems — update selection state + visual highlight
  // ----------------------------------------------------------------
  const setSelectedItems = useCallback(async (items: ModelIdMap) => {
    const components = componentsRef.current;
    if (!components) return;
    const fm = components.get(OBC.FragmentsManager);

    // Reset previous highlights, then restore persistent colors
    for (const model of fm.list.values()) {
      await model.resetHighlight(undefined);
    }
    await reapplyColorizations(fm);

    // Apply selection highlights on top
    for (const [modelId, localIdSet] of Object.entries(items)) {
      const model = fm.list.get(modelId);
      if (model && localIdSet.size > 0) {
        await model.highlight(Array.from(localIdSet), SELECTION_MATERIAL);
      }
    }

    setSelectedItemsState(items);
  }, [reapplyColorizations]);

  // ----------------------------------------------------------------
  // clearSelection
  // ----------------------------------------------------------------
  const clearSelection = useCallback(async () => {
    const components = componentsRef.current;
    if (!components) return;
    const fm = components.get(OBC.FragmentsManager);
    for (const model of fm.list.values()) {
      await model.resetHighlight(undefined);
    }
    // Restore persistent colors after clearing the selection highlight
    await reapplyColorizations(fm);
    setSelectedItemsState({});
  }, [reapplyColorizations]);

  // ----------------------------------------------------------------
  // setItemsColor — apply a persistent color to items
  // ----------------------------------------------------------------
  const setItemsColor = useCallback(
    async (items: ModelIdMap, hexColor: string) => {
      const components = componentsRef.current;
      if (!components) return;
      const fm = components.get(OBC.FragmentsManager);
      const color = new THREE.Color(hexColor);

      for (const [modelId, localIdSet] of Object.entries(items)) {
        if (localIdSet.size === 0) continue;
        const model = fm.list.get(modelId);
        if (!model) continue;
        const localIds = Array.from(localIdSet);
        await model.setColor(localIds, color);

        setColorizations(prev => {
          // Merge: replace any existing entry for this modelId+color combo
          const without = prev.filter(
            c => !(c.modelId === modelId && c.color === hexColor),
          );
          return [...without, { modelId, localIds, color: hexColor }];
        });
      }
    },
    [],
  );

  // ----------------------------------------------------------------
  // resetItemsColor
  // ----------------------------------------------------------------
  const resetItemsColor = useCallback(async (items?: ModelIdMap) => {
    const components = componentsRef.current;
    if (!components) return;
    const fm = components.get(OBC.FragmentsManager);

    if (items) {
      for (const [modelId, localIdSet] of Object.entries(items)) {
        const model = fm.list.get(modelId);
        if (model) {
          await model.resetColor(
            localIdSet.size > 0 ? Array.from(localIdSet) : undefined,
          );
        }
      }
      const modelIds = new Set(Object.keys(items));
      setColorizations(prev => prev.filter(c => !modelIds.has(c.modelId)));
    } else {
      for (const model of fm.list.values()) {
        await model.resetColor(undefined);
      }
      setColorizations([]);
    }
  }, []);

  // ----------------------------------------------------------------
  // isolateItems — ghost everything outside the selection
  // ----------------------------------------------------------------
  const isolateItems = useCallback(async (items: ModelIdMap) => {
    const components = componentsRef.current;
    if (!components) return;
    const fm = components.get(OBC.FragmentsManager);

    for (const model of fm.list.values()) {
      await model.resetHighlight(undefined);
    }
    await reapplyColorizations(fm);

    for (const model of fm.list.values()) {
      const allIds = await model.getLocalIds();
      const selectedSet = new Set(items[model.modelId] ?? []);
      const ghostIds = allIds.filter(id => !selectedSet.has(id));
      const selectIds = allIds.filter(id => selectedSet.has(id));
      if (ghostIds.length > 0) {
        await model.highlight(ghostIds, ISOLATION_GHOST_MATERIAL);
      }
      if (selectIds.length > 0) {
        await model.highlight(selectIds, SELECTION_MATERIAL);
      }
    }

    setSelectedItemsState(items);
    setIsIsolated(true);
  }, [reapplyColorizations]);

  // ----------------------------------------------------------------
  // exitIsolation — restore normal view
  // ----------------------------------------------------------------
  const exitIsolation = useCallback(async () => {
    const components = componentsRef.current;
    if (!components) return;
    const fm = components.get(OBC.FragmentsManager);
    for (const model of fm.list.values()) {
      await model.resetHighlight(undefined);
    }
    await reapplyColorizations(fm);
    setIsIsolated(false);
  }, [reapplyColorizations]);

  // ----------------------------------------------------------------
  // hideItems — make selected items invisible
  // ----------------------------------------------------------------
  const hideItems = useCallback(async (items: ModelIdMap) => {
    const components = componentsRef.current;
    if (!components) return;
    const fm = components.get(OBC.FragmentsManager);
    for (const [modelId, localIdSet] of Object.entries(items)) {
      const model = fm.list.get(modelId);
      if (model && localIdSet.size > 0) {
        await model.setVisible(Array.from(localIdSet), false);
      }
    }
    setIsHiding(true);
  }, []);

  // ----------------------------------------------------------------
  // showHiddenItems — restore visibility of all items
  // ----------------------------------------------------------------
  const showHiddenItems = useCallback(async () => {
    const components = componentsRef.current;
    if (!components) return;
    const fm = components.get(OBC.FragmentsManager);
    for (const model of fm.list.values()) {
      await model.setVisible(undefined, true);
    }
    setIsHiding(false);
  }, []);

  // ----------------------------------------------------------------
  // Raw accessors (for panels that need direct API access)
  // ----------------------------------------------------------------
  const getComponents = useCallback(() => componentsRef.current, []);
  const getWorld = useCallback(() => worldRef.current, []);

  return (
    <BIMContext.Provider
      value={{
        isInitialized,
        initError,
        loadedModels,
        selectedItems,
        colorizations,
        isIsolated,
        isHiding,
        initWorld,
        disposeWorld,
        clearModels,
        loadIFC,
        setSelectedItems,
        clearSelection,
        setItemsColor,
        resetItemsColor,
        setColorizations,
        isolateItems,
        exitIsolation,
        hideItems,
        showHiddenItems,
        getComponents,
        getWorld,
      }}
    >
      {children}
    </BIMContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useBIM = (): BIMContextType => {
  const ctx = useContext(BIMContext);
  if (!ctx) throw new Error('useBIM must be used within <BIMProvider>');
  return ctx;
};
