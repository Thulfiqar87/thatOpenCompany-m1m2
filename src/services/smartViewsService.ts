import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { SmartView } from '../types/bim';

const smartViewsCol = (projectId: string) =>
  collection(db, 'projects', projectId, 'smartViews');

export async function getSmartViews(projectId: string): Promise<SmartView[]> {
  const snap = await getDocs(smartViewsCol(projectId));
  return snap.docs.map(d => d.data() as SmartView);
}

export async function saveSmartView(view: SmartView): Promise<void> {
  const ref = doc(db, 'projects', view.projectId, 'smartViews', view.id);
  // Firestore can't store Set<number>; queries are plain objects so this is safe.
  await setDoc(ref, view);
}

export async function deleteSmartView(
  projectId: string,
  viewId: string,
): Promise<void> {
  await deleteDoc(doc(db, 'projects', projectId, 'smartViews', viewId));
}
