import { defaultProjectCommandProjectId, projectCommandDatasets } from './data/portfolio';
import { useProjectCommandStore } from './state/projectCommandStore';

export function useSelectedProjectCommandData() {
  const { createdProjectDatasets, selectedProjectId } = useProjectCommandStore();
  const createdDataset = createdProjectDatasets.find(dataset => dataset.id === selectedProjectId);
  return createdDataset ?? projectCommandDatasets[selectedProjectId as keyof typeof projectCommandDatasets] ?? projectCommandDatasets[defaultProjectCommandProjectId];
}

export function useProjectCommandProjectOptions() {
  const { createdProjectDatasets } = useProjectCommandStore();
  return [
    ...Object.values(projectCommandDatasets).map(dataset => ({
      id: dataset.id,
      label: dataset.selectorLabel,
    })),
    ...createdProjectDatasets.map(dataset => ({
      id: dataset.id,
      label: dataset.selectorLabel,
    })),
  ];
}
