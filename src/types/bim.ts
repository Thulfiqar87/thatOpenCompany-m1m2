import type { SerializedFinderQuery } from '@thatopen/components';

export interface ColorEntry {
  modelId: string;
  localIds: number[];
  color: string; // hex e.g. "#3b82f6"
}

export interface SmartView {
  id: string;
  name: string;
  projectId: string;
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  queries: SerializedFinderQuery[];
  colorizations: ColorEntry[];
  createdAt: string;
  updatedAt: string;
}
