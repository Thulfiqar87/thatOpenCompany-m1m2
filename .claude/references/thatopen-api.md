# That Open Engine — Full API Reference

## Package Structure
- `@thatopen/components` — Core engine (worlds, loaders, tools)
- `@thatopen/ui` — BUI web components (tables, panels, buttons)
- `@thatopen/fragments` — Fragment model format
- `@thatopen/components-front` — Frontend-only tools (edges, markers, etc.)

## World Setup
```typescript
const components = new OBC.Components();
const worlds = components.get(OBC.Worlds);
const world = worlds.create<OBC.SimpleScene, OBC.SimpleCamera, OBC.SimpleRenderer>();

world.scene = new OBC.SimpleScene(components);
world.renderer = new OBC.SimpleRenderer(components, container);
world.camera = new OBC.SimpleCamera(components);
components.init();
world.scene.setup();
```

## IFC Loader
```typescript
const loader = components.get(OBC.IfcLoader);
await loader.setup(); // downloads WASM automatically
const model = await loader.load(uint8ArrayBuffer);
```

## Fragments Manager
```typescript
const fragments = components.get(OBC.FragmentsManager);
const model = fragments.load(uint8ArrayBuffer); // fast binary format
fragments.dispose(); // always clean up
```

## Highlighter (Selection)
```typescript
const highlighter = components.get(OBCF.Highlighter);
highlighter.setup({ world });
highlighter.highlightOnCursor = true;
// Listen to selection
highlighter.events.select.onHighlight.add((fragmentIdMap) => {
  console.log("Selected:", fragmentIdMap);
});
```

## Hider (Show/Hide Elements)
```typescript
const hider = components.get(OBC.Hider);
hider.set(false, fragmentIdMap); // hide
hider.set(true, fragmentIdMap);  // show
```

## Clipper (Section Planes)
```typescript
const clipper = components.get(OBC.Clipper);
clipper.enabled = true;
// Double-click on model to create section plane
clipper.onAfterCreate.add((plane) => console.log(plane));
```

## Properties (IFC Metadata)
```typescript
const indexer = components.get(OBC.IfcRelationsIndexer);
await indexer.process(model);
const props = await model.getProperties(expressID);
```

## Exploder
```typescript
const exploder = components.get(OBC.Exploder);
exploder.set(true);  // explode
exploder.set(false); // collapse
```

## Disposal (Always on unmount)
```typescript
components.dispose();
```

## Common Errors
| Error | Fix |
|-------|-----|
| WASM not found | Call `await loader.setup()` before `loader.load()` |
| Black screen | Ensure `world.scene.setup()` is called after renderer init |
| Memory leak | Always call `components.dispose()` in useEffect cleanup |
| Model not visible | Check `world.scene.three.add(model)` is called |