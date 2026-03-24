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
  loadedModels: FragmentsModel[];
  selectedItems: ModelIdMap;
  colorizations: ColorEntry[];
  initWorld: (container: HTMLElement) => Promise<void>;
  disposeWorld: () => void;
  clearModels: () => Promise<void>;
  loadIFC: (file: File) => Promise<void>;
  setSelectedItems: (items: ModelIdMap) => Promise<void>;
  clearSelection: () => Promise<void>;
  setItemsColor: (items: ModelIdMap, hexColor: string) => Promise<void>;
  resetItemsColor: (items?: ModelIdMap) => Promise<void>;
  setColorizations: (c: ColorEntry[]) => void;
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
  const fragmentsInitRef = useRef(false);
  const ifcLoaderSetupRef = useRef(false);

  const [isInitialized, setIsInitialized] = useState(false);
  const [loadedModels, setLoadedModels] = useState<FragmentsModel[]>([]);
  const [selectedItems, setSelectedItemsState] = useState<ModelIdMap>({});
  const [colorizations, setColorizations] = useState<ColorEntry[]>([]);

  // ----------------------------------------------------------------
  // initWorld — called by BIMViewer on mount
  // ----------------------------------------------------------------
  const initWorld = useCallback(async (container: HTMLElement) => {
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

    world.camera = new OBC.SimpleCamera(components);
    world.renderer = new OBC.SimpleRenderer(components, container);

    // Init the FragmentsManager worker (once only)
    if (!fragmentsInitRef.current) {
      const fm = components.get(OBC.FragmentsManager);
      fm.init(fragmentsWorkerUrl);
      fragmentsInitRef.current = true;
    }

    // Setup IFC loader (once only)
    if (!ifcLoaderSetupRef.current) {
      const ifcLoader = components.get(OBC.IfcLoader);
      await ifcLoader.setup();
      ifcLoaderSetupRef.current = true;
    }

    // Start the render loop
    components.init();

    worldRef.current = world;
    setIsInitialized(true);
  }, []);

  // ----------------------------------------------------------------
  // disposeWorld — called by BIMViewer on unmount
  //   We keep the world alive and just detach the canvas so the render
  //   loop can resume on next mount without re-creating everything.
  // ----------------------------------------------------------------
  const disposeWorld = useCallback(() => {
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
    for (const model of fm.list.values()) {
      world.scene.three.remove(model.object);
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
    if (!components || !world) return;

    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    const ifcLoader = components.get(OBC.IfcLoader);
    const model = await ifcLoader.load(uint8, true, file.name);

    world.scene.three.add(model.object);

    // Tell the model which camera to use for LOD / tile culling
    if (world.camera.three instanceof THREE.PerspectiveCamera) {
      model.useCamera(world.camera.three);
    }

    // Fit view to the new model
    const localIds = await model.getLocalIds();
    const modelIdMap: ModelIdMap = { [model.modelId]: new Set(localIds) };
    await world.camera.fitToItems(modelIdMap);

    setLoadedModels(prev => [...prev, model]);
  }, []);

  // ----------------------------------------------------------------
  // setSelectedItems — update selection state + visual highlight
  // ----------------------------------------------------------------
  const setSelectedItems = useCallback(async (items: ModelIdMap) => {
    const components = componentsRef.current;
    if (!components) return;
    const fm = components.get(OBC.FragmentsManager);

    // Reset previous highlights
    for (const model of fm.list.values()) {
      await model.resetHighlight(undefined);
    }

    // Apply new highlights
    for (const [modelId, localIdSet] of Object.entries(items)) {
      const model = fm.list.get(modelId);
      if (model && localIdSet.size > 0) {
        await model.highlight(Array.from(localIdSet), SELECTION_MATERIAL);
      }
    }

    setSelectedItemsState(items);
  }, []);

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
    setSelectedItemsState({});
  }, []);

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
  // Raw accessors (for panels that need direct API access)
  // ----------------------------------------------------------------
  const getComponents = useCallback(() => componentsRef.current, []);
  const getWorld = useCallback(() => worldRef.current, []);

  return (
    <BIMContext.Provider
      value={{
        isInitialized,
        loadedModels,
        selectedItems,
        colorizations,
        initWorld,
        disposeWorld,
        clearModels,
        loadIFC,
        setSelectedItems,
        clearSelection,
        setItemsColor,
        resetItemsColor,
        setColorizations,
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
