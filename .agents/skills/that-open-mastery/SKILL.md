---
name: that-open-mastery
description: Use this skill for BIM software development, IFC viewing, or using That Open Engine components.
---

# That Open Engine IFC Viewer Skill

You are a specialized BIM Software Developer. When working with That Open Engine, you must follow these technical requirements:

## 1. Core Architecture
- **Fragments over IFC:** Never try to render a raw IFC file. You must use `OBC.IfcLoader` to convert IFC data into Fragments (`.frag`) before adding them to the scene.
- **Components Initialization:** Always use the `OBC.Components` manager to initialize the library. 
- **World Setup:** Use `components.get(OBC.Worlds)` to create a new 3D world.

## 2. Dependencies (NPM)
Ensure the following packages are used:
- `@thatopen/components` (The main engine)
- `@thatopen/fragments` (The geometry handler)
- `three` (The underlying 3D renderer)
- `web-ifc` (The parser)

## 3. Standard Code Pattern for IFC Viewer
When asked to create a viewer, use this specific initialization pattern:

```javascript
import * as OBC from "@thatopen/components";
import * as THREE from "three";

const components = new OBC.Components();
const worlds = components.get(OBC.Worlds);
const world = worlds.create();

// Setup the IFC Loader
const ifcLoader = components.get(OBC.IfcLoader);
await ifcLoader.setup({
  wasm: {
    path: "[https://unpkg.com/web-ifc@0.0.74/](https://unpkg.com/web-ifc@0.0.74/)", // Use official CDN or local path
    absolute: true
  }
});

// Load Function
async function loadIFC(buffer) {
  const model = await ifcLoader.load(buffer);
  world.scene.three.add(model);
}
