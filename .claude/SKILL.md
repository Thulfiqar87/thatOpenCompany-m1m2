---
name: aiconhub-dev
description: >
  Master skill for AI Con Hub development. Use this whenever the user is
  writing code involving That Open Engine (@thatopen/components), building
  BIM viewers, loading IFC files, working with Fragments, designing UI
  components, or applying the AI Con Hub design system. Also trigger for
  Arabic RTL layout, Iraqi construction domain logic, and any frontend
  component work. Always consult this skill before writing any viewer,
  component, or UI code.
---

# AI Con Hub — Master Development Skill

## 1. That Open Engine — Core Architecture

### Initialization Pattern
Always initialize in this order:
\`\`\`typescript
import * as OBC from "@thatopen/components";

const components = new OBC.Components();
const worlds = components.get(OBC.Worlds);
const world = worlds.create
  OBC.SimpleScene,
  OBC.SimpleCamera,
  OBC.SimpleRenderer
>();

world.scene = new OBC.SimpleScene(components);
world.renderer = new OBC.SimpleRenderer(components, container);
world.camera = new OBC.SimpleCamera(components);

components.init();
world.scene.setup();
world.camera.controls.setLookAt(12, 6, 8, 0, 0, 0);
\`\`\`

### IFC Loading
\`\`\`typescript
const ifcLoader = components.get(OBC.IfcLoader);
await ifcLoader.setup();
const file = await fetch("model.ifc");
const buffer = new Uint8Array(await file.arrayBuffer());
const model = await ifcLoader.load(buffer);
world.scene.three.add(model);
\`\`\`

### Key Components Reference
| Component | Purpose |
|-----------|---------|
| OBC.Worlds | Manages 3D scenes |
| OBC.FragmentsManager | Load/unload fragment models |
| OBC.IfcLoader | Parse raw IFC files |
| OBC.Clipper | Section planes |
| OBC.Hider | Show/hide elements |
| OBC.Highlighter | Selection and hover states |

### Rules
- Always call components.dispose() on unmount
- Use Fragments format over raw IFC in production
- Never manipulate Three.js scene directly
- Use world.renderer.three.setAnimationLoop() for render loops

---

## 2. UI/UX Design System

### Design Tokens
\`\`\`css
:root {
  --color-primary: #1B4F72;
  --color-accent: #E67E22;
  --color-surface: #F4F6F7;
  --color-dark: #1C2833;
  --color-success: #1E8449;
  --color-danger: #C0392B;
  --font-arabic: 'Cairo', 'Noto Kufi Arabic', sans-serif;
  --font-latin: 'IBM Plex Sans', monospace;
  --radius: 6px;
  --shadow: 0 2px 12px rgba(0,0,0,0.1);
}
\`\`\`

### RTL Rules
- All layouts must support dir="rtl" on root element
- Use margin-inline-start / margin-inline-end
- Test every component in both LTR and RTL

---

## 3. Project Context
- Stack: React + TypeScript + Vite + Supabase + That Open Engine
- Hosting: AWS Bahrain (me-south-1)
- Domain: Iraqi construction, FIDIC contracts, Arabic/English bilingual
- Pricing: $150-500/month SaaS per client

---

## 4. Reference Files
- Full That Open Engine API: see references/thatopen-api.md
- Full design system tokens and components: see references/design-system.md
- Supabase schema and RLS rules: see references/supabase-schema.md
