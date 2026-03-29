import type { SmartView } from '../types/bim';

const storageKey = (projectId: string) => `smartViews:${projectId}`;

function readAll(projectId: string): SmartView[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(projectId)) ?? '[]') as SmartView[];
  } catch {
    return [];
  }
}

function writeAll(projectId: string, views: SmartView[]): void {
  localStorage.setItem(storageKey(projectId), JSON.stringify(views));
}

export async function getSmartViews(projectId: string): Promise<SmartView[]> {
  return readAll(projectId);
}

export async function saveSmartView(view: SmartView): Promise<void> {
  const all = readAll(view.projectId);
  const idx = all.findIndex(v => v.id === view.id);
  if (idx >= 0) {
    all[idx] = view;
  } else {
    all.push(view);
  }
  writeAll(view.projectId, all);
}

export async function deleteSmartView(
  projectId: string,
  viewId: string,
): Promise<void> {
  writeAll(projectId, readAll(projectId).filter(v => v.id !== viewId));
}
