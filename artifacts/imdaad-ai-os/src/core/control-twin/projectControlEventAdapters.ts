import { createProjectControlEvent, type ProjectEvent, type ProjectEventSourceModule, type ProjectEventType } from './projectControlTwin';

export type ControlTwinSourceModule = ProjectEventSourceModule;

export interface CrossModuleEventInput {
  projectId: string;
  sourceModule: ControlTwinSourceModule;
  sourceObjectId?: string;
  sequence?: number;
}

export function createCrossModuleProjectEvent(
  type: ProjectEventType,
  input: CrossModuleEventInput,
): ProjectEvent {
  return {
    ...createProjectControlEvent(input.projectId, type, input.sequence),
    sourceModule: input.sourceModule,
    sourceObjectId: input.sourceObjectId ?? null,
  };
}

export const controlTwinEventAdapters = {
  vendorUnderperformance: (input: Omit<CrossModuleEventInput, 'sourceModule'>) =>
    createCrossModuleProjectEvent('contractor-underperformance', { ...input, sourceModule: 'VendorIQ' }),
  evidenceRejected: (input: Omit<CrossModuleEventInput, 'sourceModule'>) =>
    createCrossModuleProjectEvent('evidence-rejected', { ...input, sourceModule: 'Evidence' }),
  inspectionFailure: (input: Omit<CrossModuleEventInput, 'sourceModule'>) =>
    createCrossModuleProjectEvent('inspection-failure', { ...input, sourceModule: 'InspectPro' }),
  approvalDelay: (input: Omit<CrossModuleEventInput, 'sourceModule'>) =>
    createCrossModuleProjectEvent('missing-approval', { ...input, sourceModule: 'Approvals' }),
  fieldProductivityEvent: (input: Omit<CrossModuleEventInput, 'sourceModule'>) =>
    createCrossModuleProjectEvent('weather-disruption', { ...input, sourceModule: 'FieldOps' }),
};
