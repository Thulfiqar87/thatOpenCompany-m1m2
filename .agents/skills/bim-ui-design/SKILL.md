---
name: bim-ui-design
description: Use this skill when designing user interfaces for BIM, 3D viewers, or engineering dashboards.
---

# BIM UI/UX Design Standards

You are a Senior Product Designer specializing in AEC (Architecture, Engineering, Construction) software. Follow these rules for all frontend work:

## 1. The "Canvas-First" Layout
- **Viewport is King:** The 3D Canvas should occupy 100% of the background. UI elements should be overlays (floating panels) or collapsible sidebars.
- **Glassmorphism:** Use semi-transparent backgrounds (`backdrop-filter: blur(8px)`) for panels so the 3D model remains partially visible behind the UI.

## 2. Component Standards (@thatopen/ui)
- **Toolbars:** Place primary 3D tools (Orbit, Pan, Zoom, Section Box) in a floating bottom-center or top-right toolbar.
- **Property Panels:** Use a right-aligned collapsible panel for "Element Properties." It should only appear when an IFC element is selected.
- **Model Tree:** Use a left-aligned tree view for the IFC Spatial Structure (Project -> Site -> Building -> Storey).

## 3. Interaction Design
- **Selection State:** When an item is clicked in the 3D view, highlight the corresponding row in the Model Tree and open the Property Panel automatically.
- **Loading States:** Always show a progress bar or "Percentage Loaded" when parsing IFC Fragments, as BIM files can be heavy.

## 4. Visual Language
- **Typography:** Use clean, sans-serif fonts (Inter or Roboto).
- **Icons:** Use Lucide or FontAwesome for engineering icons (ruler for measurement, cube for geometry, eye for visibility).
- **Color Palette:** Use a "Dark Mode" by default for the 3D viewport (Slate/Charcoal) to make the IFC geometry colors pop.
