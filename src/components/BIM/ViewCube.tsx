import { useCallback } from 'react';
import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import { Home, EyeOff, Eye, Scan, ScanLine } from 'lucide-react';
import { useBIM } from '../../context/BIMContext';

// ----------------------------------------------------------------
// Isometric cube geometry — SVG viewBox 0 0 80 68
// 3D corner assignments (x=right, y=up, z=toward viewer):
//   A=(-1,+1,-1)  B=(+1,+1,-1)  C=(+1,+1,+1)  D=(-1,+1,+1)
//   E=(+1,-1,-1)  F=(-1,-1,+1)  G=(+1,-1,+1)
// ----------------------------------------------------------------
const A = [40,  6] as const;
const B = [66, 20] as const;
const C = [40, 34] as const;
const D = [14, 20] as const;
const E = [66, 48] as const;
const F = [14, 48] as const;
const G = [40, 62] as const;

type Dir = [number, number, number];

const FACES = [
  {
    pts: `${A} ${B} ${C} ${D}`,
    base: 'rgba(100,116,139,0.85)',
    hover: 'rgba(37,99,235,0.70)',
    dir: [0, 1, 0] as Dir,
    label: 'TOP', lx: 40, ly: 21,
  },
  {
    pts: `${B} ${E} ${G} ${C}`,
    base: 'rgba(71,85,105,0.85)',
    hover: 'rgba(37,99,235,0.58)',
    dir: [1, 0, 0] as Dir,
    label: 'RIGHT', lx: 53, ly: 43,
  },
  {
    pts: `${D} ${C} ${G} ${F}`,
    base: 'rgba(51,65,85,0.85)',
    hover: 'rgba(37,99,235,0.48)',
    dir: [0, 0, 1] as Dir,
    label: 'FRONT', lx: 27, ly: 43,
  },
];

const EDGES = [
  { x1: A[0], y1: A[1], x2: B[0], y2: B[1], dir: [ 0, 1,-1] as Dir, tip: 'Top · Back'      },
  { x1: A[0], y1: A[1], x2: D[0], y2: D[1], dir: [-1, 1, 0] as Dir, tip: 'Top · Left'      },
  { x1: B[0], y1: B[1], x2: C[0], y2: C[1], dir: [ 1, 1, 0] as Dir, tip: 'Top · Right'     },
  { x1: D[0], y1: D[1], x2: C[0], y2: C[1], dir: [ 0, 1, 1] as Dir, tip: 'Top · Front'     },
  { x1: B[0], y1: B[1], x2: E[0], y2: E[1], dir: [ 1, 0,-1] as Dir, tip: 'Right · Back'    },
  { x1: D[0], y1: D[1], x2: F[0], y2: F[1], dir: [-1, 0, 1] as Dir, tip: 'Front · Left'    },
  { x1: C[0], y1: C[1], x2: G[0], y2: G[1], dir: [ 1, 0, 1] as Dir, tip: 'Front · Right'   },
  { x1: E[0], y1: E[1], x2: G[0], y2: G[1], dir: [ 1,-1, 0] as Dir, tip: 'Right · Bottom'  },
  { x1: F[0], y1: F[1], x2: G[0], y2: G[1], dir: [ 0,-1, 1] as Dir, tip: 'Front · Bottom'  },
];

const CORNERS = [
  { cx: A[0], cy: A[1], dir: [-1, 1,-1] as Dir, tip: 'Back · Top · Left'     },
  { cx: B[0], cy: B[1], dir: [ 1, 1,-1] as Dir, tip: 'Back · Top · Right'    },
  { cx: C[0], cy: C[1], dir: [ 1, 1, 1] as Dir, tip: 'Front · Top · Right'   },
  { cx: D[0], cy: D[1], dir: [-1, 1, 1] as Dir, tip: 'Front · Top · Left'    },
  { cx: E[0], cy: E[1], dir: [ 1,-1,-1] as Dir, tip: 'Back · Bottom · Right' },
  { cx: F[0], cy: F[1], dir: [-1,-1, 1] as Dir, tip: 'Front · Bottom · Left' },
  { cx: G[0], cy: G[1], dir: [ 1,-1, 1] as Dir, tip: 'Front · Bottom · Right'},
];

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
const ViewCube = () => {
  const {
    getWorld, getComponents,
    loadedModels, selectedItems,
    isIsolated, isHiding,
    isolateItems, exitIsolation,
    hideItems, showHiddenItems,
  } = useBIM();

  const hasModel = loadedModels.length > 0;
  const hasSelection = Object.values(selectedItems).some(s => s.size > 0);

  const navigate = useCallback(async (dir: Dir) => {
    const world = getWorld();
    if (!world) return;
    const controls = world.camera.controls;
    const cam = world.camera.three;
    const target = controls.getTarget(new THREE.Vector3());
    const dist = cam.position.distanceTo(target);
    const pos = target.clone().add(
      new THREE.Vector3(...dir).normalize().multiplyScalar(dist),
    );
    await controls.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, true);
  }, [getWorld]);

  const handleFitView = useCallback(async () => {
    const components = getComponents();
    const world = getWorld();
    if (!components || !world) return;
    const fm = components.get(OBC.FragmentsManager);
    const allItems: OBC.ModelIdMap = {};
    for (const model of fm.list.values()) {
      const ids = await model.getLocalIds();
      allItems[model.modelId] = new Set(ids);
    }
    if (Object.keys(allItems).length > 0) {
      await world.camera.fitToItems(allItems);
    }
  }, [getComponents, getWorld]);

  const handleHideToggle = useCallback(async () => {
    if (isHiding) {
      await showHiddenItems();
    } else {
      await hideItems(selectedItems);
    }
  }, [isHiding, hideItems, showHiddenItems, selectedItems]);

  const handleIsolateToggle = useCallback(async () => {
    if (isIsolated) {
      await exitIsolation();
    } else {
      await isolateItems(selectedItems);
    }
  }, [isIsolated, isolateItems, exitIsolation, selectedItems]);

  const btnBase =
    'w-full flex items-center justify-center py-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed';
  const btnNormal = `${btnBase} text-brand hover:text-white hover:bg-slate-700`;
  const btnActive  = `${btnBase} text-brand bg-brand/10 hover:bg-brand/20`;

  return (
    <div className="absolute top-4 right-4 z-20 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl p-1.5 flex flex-col items-center gap-1">
      {/* ── Cube ──────────────────────────────────────────── */}
      <svg width="80" height="68" viewBox="0 0 80 68" style={{ display: 'block' }}>

        {/* ── Faces ─────────────────────────────────────────── */}
        {FACES.map(f => (
          <polygon
            key={f.label}
            points={f.pts}
            fill={f.base}
            stroke="#94a3b8"
            strokeWidth="0.5"
            cursor="pointer"
            style={{ transition: 'fill 0.12s' }}
            onMouseEnter={e => e.currentTarget.setAttribute('fill', f.hover)}
            onMouseLeave={e => e.currentTarget.setAttribute('fill', f.base)}
            onClick={() => void navigate(f.dir)}
          >
            <title>{f.label} view</title>
          </polygon>
        ))}

        {/* ── Face labels (non-interactive) ─────────────────── */}
        {FACES.map(f => (
          <text
            key={`lbl-${f.label}`}
            x={f.lx} y={f.ly}
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize="7"
            fontWeight="700"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {f.label}
          </text>
        ))}

        {/* ── Edges (transparent hit areas) ─────────────────── */}
        {EDGES.map(ed => (
          <line
            key={ed.tip}
            x1={ed.x1} y1={ed.y1} x2={ed.x2} y2={ed.y2}
            strokeWidth="8"
            stroke="transparent"
            cursor="pointer"
            style={{ transition: 'stroke 0.12s' }}
            onMouseEnter={e => e.currentTarget.setAttribute('stroke', 'rgba(37,99,235,0.55)')}
            onMouseLeave={e => e.currentTarget.setAttribute('stroke', 'transparent')}
            onClick={() => void navigate(ed.dir)}
          >
            <title>{ed.tip} view</title>
          </line>
        ))}

        {/* ── Corners ───────────────────────────────────────── */}
        {CORNERS.map(co => (
          <circle
            key={co.tip}
            cx={co.cx} cy={co.cy} r="4"
            fill="#64748b"
            stroke="#cbd5e1"
            strokeWidth="0.5"
            cursor="pointer"
            style={{ transition: 'fill 0.12s' }}
            onMouseEnter={e => e.currentTarget.setAttribute('fill', '#f59e0b')}
            onMouseLeave={e => e.currentTarget.setAttribute('fill', '#64748b')}
            onClick={() => void navigate(co.dir)}
          >
            <title>{co.tip} view</title>
          </circle>
        ))}
      </svg>

      {/* ── Divider ───────────────────────────────────────── */}
      <div className="w-full h-px bg-slate-700/60 my-0.5" />

      {/* ── Fit view ──────────────────────────────────────── */}
      <button
        onClick={() => void handleFitView()}
        disabled={!hasModel}
        className={btnNormal}
        title="Fit view to model"
      >
        <Home className="w-4 h-4" />
      </button>

      {/* ── Hide / Show hidden ────────────────────────────── */}
      <button
        onClick={() => void handleHideToggle()}
        disabled={!isHiding && !hasSelection}
        className={isHiding ? btnActive : btnNormal}
        title={isHiding ? 'Show hidden elements' : 'Hide selected elements'}
      >
        {isHiding ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>

      {/* ── Isolate / Exit isolation ──────────────────────── */}
      <button
        onClick={() => void handleIsolateToggle()}
        disabled={!isIsolated && !hasSelection}
        className={isIsolated ? btnActive : btnNormal}
        title={isIsolated ? 'Exit isolation' : 'Isolate selected elements'}
      >
        {isIsolated ? <Scan className="w-4 h-4" /> : <ScanLine className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default ViewCube;
