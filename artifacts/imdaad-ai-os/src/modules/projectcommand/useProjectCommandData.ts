import {
  defaultProjectCommandProjectId,
  projectCommandDatasets,
  projectCommandProperties,
  projectCommandPortfolios,
  projectCommandOrganizations,
  type ProjectCommandPropertyId,
} from './data/portfolio';
import { useProjectCommandStore } from './state/projectCommandStore';

function staticDatasets() {
  return Object.values(projectCommandDatasets);
}

export function useSelectedProjectCommandData() {
  const { createdProjectDatasets, selectedProjectId } = useProjectCommandStore();
  const createdDataset = createdProjectDatasets.find(dataset => dataset.id === selectedProjectId);
  return createdDataset ?? projectCommandDatasets[selectedProjectId as keyof typeof projectCommandDatasets] ?? projectCommandDatasets[defaultProjectCommandProjectId];
}

export function useProjectCommandProjectOptions(propertyId?: ProjectCommandPropertyId) {
  const { createdProjectDatasets } = useProjectCommandStore();
  return [
    ...staticDatasets().map(dataset => ({
      id: dataset.id,
      label: dataset.project.name,
      selectorLabel: dataset.selectorLabel,
      propertyId: dataset.property.id,
      propertyName: dataset.property.name,
      projectType: dataset.project.projectType,
    })),
    ...createdProjectDatasets.map(dataset => ({
      id: dataset.id,
      label: dataset.project.name,
      selectorLabel: dataset.selectorLabel,
      propertyId: dataset.property.id,
      propertyName: dataset.property.name,
      projectType: dataset.project.projectType,
    })),
  ].filter(option => !propertyId || option.propertyId === propertyId);
}

export function useProjectCommandPropertyOptions() {
  const { createdProperties } = useProjectCommandStore();
  const properties = [
    ...projectCommandProperties,
    ...createdProperties.filter(property => !projectCommandProperties.some(existing => existing.id === property.id)),
  ];

  return properties.map(property => {
    const portfolio = projectCommandPortfolios.find(item => item.id === property.portfolioId);
    const organization = projectCommandOrganizations.find(item => item.id === portfolio?.organizationId);
    return {
      id: property.id,
      label: property.name,
      type: property.type,
      location: property.location,
      portfolioName: portfolio?.name ?? 'Portfolio',
      organizationName: organization?.name ?? 'Organization',
    };
  });
}
