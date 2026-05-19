import { useEffect, useMemo, useState } from 'react';
import type { MouseEvent, PointerEvent, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileText,
  FileUp,
  Gauge,
  GitBranch,
  Layers3,
  Loader2,
  PencilLine,
  RefreshCw,
  Rocket,
  ScanLine,
  Sparkles,
  UploadCloud,
  WandSparkles,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ProjectCommandDataset } from '../data/portfolio';
import {
  buildProjectCommandDatasetFromExtraction,
  extractProjectContext,
  generateProjectControlBaseline,
  type GeneratedProjectControlBaseline,
} from '../data/projectCreationEngine';
import { parseProjectDocumentFile } from '../data/projectDocumentParser';
import { sampleSobhaPilotBrief, type ExtractedProjectContext } from '../data/projectExtractionDemoData';

type CreateProjectStep = 'import' | 'understanding' | 'review' | 'baseline' | 'launch';

type ProjectMaterialState = {
  fileName: string;
  documentText: string;
  parserMethod: string;
  parserWarning: string;
  fileParseStatus: 'idle' | 'reading' | 'ready' | 'limited' | 'error';
  pastedText: string;
  useSample: boolean;
  manual: boolean;
};

const createSteps: Array<{ id: CreateProjectStep; label: string }> = [
  { id: 'import', label: 'Import Context' },
  { id: 'understanding', label: 'AI Understanding' },
  { id: 'review', label: 'Review & Correct' },
  { id: 'baseline', label: 'Generate Baseline' },
  { id: 'launch', label: 'Launch' },
];

const extractionSteps = [
  'Reading project document',
  'Extracting property details',
  'Identifying project scope',
  'Detecting budget and contract value',
  'Mapping work packages',
  'Finding milestones and handover dates',
  'Identifying vendors and obligations',
  'Detecting early risks',
  'Preparing control baseline',
];

const baselineSteps = [
  'Creating programme phases',
  'Building cost baseline',
  'Mapping stage gates',
  'Seeding risk register',
  'Creating vendor map',
  'Registering obligations',
  'Adding evidence requirements',
  'Building forecast model',
  'Creating manager actions',
];

const confidenceBreakdown = [
  { label: 'Property', value: 96 },
  { label: 'Scope', value: 94 },
  { label: 'Cost', value: 94 },
  { label: 'Vendors', value: 84 },
  { label: 'Obligations', value: 84 },
];

const baselinePipeline = [
  { label: 'Programme', detail: 'Phases and milestones', icon: GitBranch },
  { label: 'Cost', detail: 'Budget, CPI, EAC', icon: Gauge },
  { label: 'Gates', detail: 'Approvals and blockers', icon: ClipboardCheck },
  { label: 'Evidence', detail: 'Proof requirements', icon: FileText },
  { label: 'Decisions', detail: 'Manager action queue', icon: BrainCircuit },
];

function formatMoney(value: number) {
  if (value >= 1_000_000) return `AED ${Math.round(value / 1_000_000)}M`;
  return `AED ${value.toLocaleString('en-US')}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function sourceTypeLabel(sourceType: ExtractedProjectContext['sourceType']) {
  switch (sourceType) {
    case 'uploaded-file':
      return 'Uploaded document parsed';
    case 'pasted-brief':
      return 'Pasted brief parsed';
    case 'sample-document':
      return 'Saved project brief';
    case 'manual':
      return 'Manual context';
    default:
      return 'Project context';
  }
}

function sourceTypeTone(sourceType: ExtractedProjectContext['sourceType']) {
  if (sourceType === 'uploaded-file') return 'border-emerald-300/35 bg-emerald-500/12 text-emerald-100';
  if (sourceType === 'sample-document') return 'border-blue-300/35 bg-blue-500/12 text-blue-100';
  if (sourceType === 'pasted-brief') return 'border-purple-300/35 bg-purple-500/12 text-purple-100';
  return 'border-amber-300/35 bg-amber-500/12 text-amber-100';
}

function cloneExtraction(extracted: ExtractedProjectContext) {
  return JSON.parse(JSON.stringify(extracted)) as ExtractedProjectContext;
}

function activatePointer(event: PointerEvent<HTMLButtonElement>, action: () => void) {
  event.currentTarget.dataset.pointerActivated = 'true';
  action();
}

function activateClick(event: MouseEvent<HTMLButtonElement>, action: () => void) {
  if (event.currentTarget.dataset.pointerActivated === 'true') {
    delete event.currentTarget.dataset.pointerActivated;
    return;
  }
  action();
}

function ConfidenceBadge({ value }: { value: number }) {
  const tone = value >= 90 ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : value >= 82 ? 'border-blue-400/30 bg-blue-500/10 text-blue-200' : 'border-amber-400/30 bg-amber-500/10 text-amber-200';
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-black ${tone}`}>
      <Sparkles className="h-3 w-3" />
      {value}% confidence
    </span>
  );
}

function NeedsConfirmationBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] font-black text-amber-200">
      <PencilLine className="h-3 w-3" />
      Needs confirmation
    </span>
  );
}

function SourcePill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[#24486F] bg-[#061529] px-2 py-1 text-[11px] font-black text-[#9DBBE0]">
      <ScanLine className="h-3 w-3 text-blue-200" />
      {children}
    </span>
  );
}

function SampleDocumentButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onPointerDown={event => activatePointer(event, onClick)}
      onClick={event => activateClick(event, onClick)}
      className="group inline-flex items-center justify-center gap-3 rounded-lg border border-blue-300/45 bg-[linear-gradient(135deg,rgba(46,127,255,0.28),rgba(6,21,41,0.92))] px-4 py-3 text-left text-[12px] font-black text-blue-50 shadow-[0_0_28px_rgba(47,124,255,0.18)] transition hover:border-blue-200/80 hover:bg-blue-500/25"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-blue-400/18 text-blue-100 transition group-hover:bg-blue-400/28">
        <FileText className="h-4 w-4" />
      </span>
      <span>
        <span className="block">Use saved project brief</span>
        <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-blue-200/80">Fallback context</span>
      </span>
    </button>
  );
}

function IconBox({ icon: Icon, tone = 'blue' }: { icon: LucideIcon; tone?: 'blue' | 'green' | 'amber' | 'purple' }) {
  const tones = {
    blue: 'border-blue-400/30 bg-blue-500/15 text-blue-200',
    green: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
    amber: 'border-amber-400/30 bg-amber-500/15 text-amber-200',
    purple: 'border-purple-400/30 bg-purple-500/15 text-purple-200',
  };
  return (
    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${tones[tone]}`}>
      <Icon className="h-5 w-5" />
    </span>
  );
}

function SectionShell({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#24486F] bg-[#081A2F]/82 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[12px] font-black uppercase tracking-[0.12em] text-[#91A9C7]">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function ExtractedSignalCard({
  title,
  value,
  count,
  confidence,
  sourceExcerpt,
  needsConfirmation,
}: {
  title: string;
  value: string;
  count: number;
  confidence: number;
  sourceExcerpt: string;
  needsConfirmation?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#24486F] bg-[linear-gradient(180deg,rgba(10,29,51,0.98),rgba(6,21,41,0.98))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-black text-white">{title}</p>
          <p className="mt-1 text-[12px] text-[#8FB4E4]">{value}</p>
        </div>
        <span className="rounded-md bg-[#102F55] px-2 py-1 text-[11px] font-black text-[#8EC2FF]">{count}</span>
      </div>
      <div className="mb-3 rounded-md border border-[#1D3F64] bg-[#061529] px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6F89AA]">Source excerpt</p>
        <p className="mt-1 text-[11px] font-bold leading-relaxed text-[#C7D9EF]">{sourceExcerpt}</p>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[#10213B]">
        <div className="h-full rounded-full bg-[linear-gradient(90deg,#2E7FFF,#38D98A)] transition-all" style={{ width: `${confidence}%` }} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ConfidenceBadge value={confidence} />
        {needsConfirmation ? <NeedsConfirmationBadge /> : null}
      </div>
    </div>
  );
}

function SourceAuditStrip({ extracted }: { extracted: ExtractedProjectContext }) {
  const parserSignal = extracted.extractionSignals.find(signal => signal.id === 'parser');
  const sourceSignal = extracted.extractionSignals.find(signal => signal.id !== 'parser' && signal.sourceExcerpt);
  const sourceExcerpt = sourceSignal?.sourceExcerpt || parserSignal?.sourceExcerpt || 'No source excerpt was captured for this extraction.';
  const parserDetail = parserSignal?.value || `${extracted.signalCount} useful project details extracted from the selected context.`;

  return (
    <div className="sticky top-0 z-20 mb-5 rounded-lg border border-blue-300/30 bg-[#07192D]/96 p-4 shadow-[0_18px_34px_rgba(0,0,0,0.28)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-300/35 bg-blue-500/15 text-blue-100">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#8FA7C5]">AI source proof</p>
              <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${sourceTypeTone(extracted.sourceType)}`}>
                {sourceTypeLabel(extracted.sourceType)}
              </span>
            </div>
            <p className="mt-1 truncate text-[14px] font-black text-white">{extracted.sourceName}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#9DBBE0]">{parserDetail}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ConfidenceBadge value={extracted.confidence} />
          {extracted.confirmationCount > 0 ? <NeedsConfirmationBadge /> : null}
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-[#24486F] bg-[#061529] px-3 py-2">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#6F89AA]">Evidence excerpt</p>
        <p className="mt-1 line-clamp-2 text-[12px] font-bold leading-relaxed text-[#B8D7FF]">{sourceExcerpt}</p>
      </div>
    </div>
  );
}

function BaselineSummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-[#24486F] bg-[#07192D] p-4">
      <div className="mb-3 flex items-center gap-3">
        <IconBox icon={Icon} tone="green" />
        <div>
          <p className="text-[18px] font-black text-white">{value}</p>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8FA7C5]">{label}</p>
        </div>
      </div>
      <p className="text-[12px] leading-relaxed text-[#A9C5E8]">{detail}</p>
    </div>
  );
}

function WizardProgress({ currentStep }: { currentStep: CreateProjectStep }) {
  const currentIndex = createSteps.findIndex(item => item.id === currentStep);
  return (
    <div className="grid gap-2 md:grid-cols-5">
      {createSteps.map((item, index) => {
        const active = item.id === currentStep;
        const complete = index < currentIndex;
        return (
          <div
            key={item.id}
            className={`rounded-lg border px-3 py-2 text-[11px] font-black transition ${
              active
                ? 'border-blue-300/70 bg-blue-500/20 text-white shadow-[0_0_28px_rgba(47,124,255,0.22)]'
                : complete
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-[#24486F] bg-[#07192D] text-[#7E98B8]'
            }`}
          >
            <span className="mr-2">{index + 1}</span>
            {item.label}
          </div>
        );
      })}
    </div>
  );
}

function StepFrame({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.18 }}
      className="flex h-full min-h-0 flex-1 flex-col"
    >
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>
      {footer ? <div className="mt-5 border-t border-[#1E3C61] pt-4">{footer}</div> : null}
    </motion.div>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={event => activatePointer(event, onClick)}
      onClick={event => activateClick(event, onClick)}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 py-3 text-[13px] font-black text-white shadow-lg shadow-blue-950/25 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onPointerDown={event => activatePointer(event, onClick)}
      onClick={event => activateClick(event, onClick)}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#24486F] bg-[#07192D] px-5 py-3 text-[13px] font-black text-[#BFD8F7] transition hover:border-blue-300/50 hover:text-white"
    >
      {children}
    </button>
  );
}

function ProjectContextImportStep({
  material,
  onFile,
  onUseSample,
  onManual,
  onContinue,
}: {
  material: ProjectMaterialState;
  onFile: (file: File) => void;
  onUseSample: () => void;
  onManual: () => void;
  onContinue: () => void;
}) {
  const canContinue = Boolean(material.fileName || material.useSample) && material.fileParseStatus !== 'reading';
  const parserStatusLabel = material.fileParseStatus === 'reading'
    ? 'Reading file...'
    : material.fileParseStatus === 'ready'
      ? `${material.documentText.length.toLocaleString()} readable characters extracted`
      : material.fileParseStatus === 'limited'
        ? 'Limited text extracted - review will require confirmation'
        : material.fileParseStatus === 'error'
          ? 'Could not read enough text - try a DOCX/XLSX file or paste the project brief'
          : '';
  return (
    <StepFrame
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onPointerDown={event => activatePointer(event, onUseSample)}
              onClick={event => activateClick(event, onUseSample)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-300/45 bg-blue-500/15 px-4 py-3 text-[12px] font-black text-blue-100 transition hover:border-blue-200/80 hover:bg-blue-500/25"
            >
              <FileText className="h-4 w-4" />
              Use saved project brief
            </button>
            <button type="button" onClick={onManual} className="text-[12px] font-bold text-[#8FB4E4] underline-offset-4 hover:text-white hover:underline">
              Continue without document
            </button>
          </div>
          <PrimaryButton onClick={onContinue} disabled={!canContinue}>
            Start AI Understanding
            <ArrowRight className="h-4 w-4" />
          </PrimaryButton>
        </div>
      }
    >
      <div className="mx-auto max-w-5xl">
        <section className="rounded-lg border border-[#24486F] bg-[#07192D] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
          <div className="flex items-start gap-4">
            <IconBox icon={UploadCloud} tone="blue" />
            <div>
              <h3 className="text-[22px] font-black text-white">Upload LOA, BOQ, contract award, or project summary</h3>
              <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[#9DBBE0]">
                ProjectCommand reads document context first, then creates construction controls from the source material.
              </p>
            </div>
          </div>

          <label
            htmlFor="project-context-file"
            className="group mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-blue-300/45 bg-[linear-gradient(180deg,rgba(46,127,255,0.12),rgba(6,21,41,0.74))] px-5 py-12 text-center transition hover:border-blue-200/80 hover:bg-blue-500/15"
          >
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-blue-300/30 bg-blue-500/15 text-blue-100 transition group-hover:scale-[1.03]">
              <FileUp className="h-7 w-7" />
            </span>
            <span className="mt-3 text-[14px] font-black text-white">{material.fileName || 'Drop in a project document'}</span>
            <span className="mt-1 text-[12px] text-[#8FB4E4]">PDF, DOC, DOCX, XLS, XLSX accepted</span>
            {parserStatusLabel && (
              <span className={`mt-3 rounded-full border px-3 py-1 text-[11px] font-black ${
                material.fileParseStatus === 'ready'
                  ? 'border-emerald-300/30 bg-emerald-500/12 text-emerald-100'
                  : material.fileParseStatus === 'reading'
                    ? 'border-blue-300/30 bg-blue-500/12 text-blue-100'
                    : 'border-amber-300/30 bg-amber-500/12 text-amber-100'
              }`}>
                {parserStatusLabel}
              </span>
            )}
          </label>
          <input
            id="project-context-file"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            className="sr-only"
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) onFile(file);
            }}
          />
          {material.parserWarning && (
            <div className="mt-3 rounded-lg border border-amber-300/25 bg-amber-500/10 p-3 text-[11px] font-bold leading-relaxed text-amber-100">
              {material.parserWarning}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-[#8FA7C5]">
            {['LOA', 'Project brief', 'Contract summary', 'BOQ summary', 'Programme summary', 'Consultant report'].map(item => (
              <span key={item} className="rounded-md border border-[#24486F] bg-[#0A1D33] px-2 py-1">
                {item}
              </span>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-[#24486F] bg-[#061529] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#6F89AA]">Document parser will extract</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {['Property and project identity', 'Budget and commercial terms', 'Work packages and milestones', 'Vendors, obligations, evidence'].map(item => (
                <div key={item} className="flex items-center gap-2 text-[12px] font-bold text-[#C7D9EF]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </StepFrame>
  );
}

function AIProjectUnderstandingStep({
  loadingIndex,
  done,
  extracted,
  sourceName,
  onBack,
  onContinue,
}: {
  loadingIndex: number;
  done: boolean;
  extracted: ExtractedProjectContext | null;
  sourceName: string;
  onBack: () => void;
  onContinue: () => void;
}) {
  const scanProgress = Math.min(100, Math.round(((loadingIndex + 1) / extractionSteps.length) * 100));

  if (!done || !extracted) {
    return (
      <StepFrame
        footer={
          <div className="flex justify-between">
            <SecondaryButton onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </SecondaryButton>
          </div>
        }
      >
        <div className="rounded-lg border border-[#24486F] bg-[#07192D] p-6">
          <div className="mb-6 flex items-center gap-4">
            <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-lg border border-blue-300/35 bg-blue-500/15 text-blue-100 shadow-[0_0_28px_rgba(47,124,255,0.22)]">
              <Loader2 className="h-6 w-6 animate-spin" />
            </span>
            <div>
              <h3 className="text-[22px] font-black text-white">AI is understanding the project material</h3>
              <p className="mt-1 text-[13px] text-[#9DBBE0]">ProjectCommand is reading the imported context and building the project baseline.</p>
            </div>
          </div>
          <div className="mb-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-lg border border-blue-300/24 bg-[#061529] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6F89AA]">Document currently being read</p>
                  <p className="mt-1 text-[14px] font-black text-white">{sourceName}</p>
                </div>
                <span className="rounded-md border border-blue-300/30 bg-blue-500/12 px-3 py-1 text-[11px] font-black text-blue-100">{scanProgress}% scanned</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#10213B]">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#2E7FFF,#38D98A)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.28 }}
                />
              </div>
              <div className="mt-4 space-y-2">
                {[
                  'Letter of Award and project summary for Sobha Pilot Tower...',
                  'Contract value: AED 420,000,000. Target handover: 12 August 2026.',
                  'Packages include preliminaries, design approvals, substructure...',
                ].map((line, index) => (
                  <div key={line} className="flex items-center gap-3 rounded-md border border-[#1D3F64] bg-[#07192D] px-3 py-2">
                    <span className={`h-2 w-2 rounded-full ${index <= loadingIndex % 3 ? 'bg-emerald-300' : 'bg-[#315071]'}`} />
                    <span className="text-[11px] font-bold text-[#A9C5E8]">{line}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-[#24486F] bg-[#061529] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6F89AA]">Signals forming</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {['Property', 'Project', 'Budget', 'Vendors', 'Packages', 'Milestones', 'Risks', 'Evidence'].map((item, index) => {
                  const live = index <= loadingIndex;
                  return (
                    <div key={item} className={`rounded-md border px-3 py-2 text-[11px] font-black transition ${live ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100' : 'border-[#1D3F64] bg-[#07192D] text-[#6F89AA]'}`}>
                      {item}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {extractionSteps.map((item, index) => {
              const complete = index < loadingIndex;
              const active = index === loadingIndex;
              return (
                <div
                  key={item}
                  className={`rounded-lg border p-4 transition ${
                    active
                      ? 'border-blue-300/70 bg-blue-500/16 text-white shadow-[0_0_26px_rgba(47,124,255,0.2)]'
                      : complete
                        ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                        : 'border-[#24486F] bg-[#061529] text-[#7E98B8]'
                  }`}
                >
                  <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-md bg-[#102F55]">
                    {complete ? <CheckCircle2 className="h-4 w-4" /> : <BrainCircuit className="h-4 w-4" />}
                  </div>
                  <p className="text-[12px] font-black">{item}</p>
                </div>
              );
            })}
          </div>
        </div>
      </StepFrame>
    );
  }

  return (
    <StepFrame
      footer={
        <div className="flex flex-wrap justify-between gap-3">
          <SecondaryButton onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </SecondaryButton>
          <PrimaryButton onClick={onContinue}>
            Review Extracted Data
            <ArrowRight className="h-4 w-4" />
          </PrimaryButton>
        </div>
      }
    >
      <div className="rounded-lg border border-[#24486F] bg-[#07192D] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <IconBox icon={BrainCircuit} tone="blue" />
            <div>
              <h3 className="text-[22px] font-black text-white">AI extracted {extracted.signalCount} useful project details</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#9DBBE0]">
                Document-aware extraction found the property, project scope, budget, vendor responsibilities, milestones, risks, obligations, and evidence requirements.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 rounded-lg border border-[#24486F] bg-[#061529] px-4 py-3 sm:items-end">
            <span className="text-[12px] font-black text-white">Project understanding confidence: {extracted.confidence}%</span>
            <ConfidenceBadge value={extracted.confidence} />
            <span className="text-[12px] font-bold text-[#8FB4E4]">{extracted.confirmationCount} items require confirmation</span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-[#24486F] bg-[#061529] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8FA7C5]">Confidence scoring</p>
          <SourcePill>{extracted.sourceName}</SourcePill>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {confidenceBreakdown.map(item => (
            <div key={item.label} className="rounded-lg border border-[#1D3F64] bg-[#07192D] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-black text-white">{item.label}</span>
                <span className="text-[11px] font-black text-emerald-200">{item.value}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#10213B]">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,#2E7FFF,#38D98A)]" style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {extracted.extractionSignals.map(signal => (
          <ExtractedSignalCard key={signal.id} {...signal} />
        ))}
      </div>
    </StepFrame>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  helper,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7E98B8]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-lg border border-[#24486F] bg-[#061529] px-3 text-[13px] font-bold text-white outline-none transition focus:border-blue-300/60"
      />
      {helper ? <span className="mt-1 block text-[11px] font-bold text-[#8FB4E4]">{helper}</span> : null}
    </label>
  );
}

function TextAreaList({ label, values, onChange }: { label: string; values: string[]; onChange: (values: string[]) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7E98B8]">{label}</span>
      <textarea
        value={values.join('\n')}
        onChange={event => onChange(event.target.value.split('\n').map(item => item.trim()).filter(Boolean))}
        className="mt-2 min-h-[118px] w-full resize-none rounded-lg border border-[#24486F] bg-[#061529] px-3 py-3 text-[13px] font-bold leading-relaxed text-white outline-none transition focus:border-blue-300/60"
      />
    </label>
  );
}

function ExtractedProjectReviewStep({
  extracted,
  onUpdate,
  onConfirmAll,
  onRegenerate,
  onBack,
  onContinue,
}: {
  extracted: ExtractedProjectContext;
  onUpdate: (next: ExtractedProjectContext) => void;
  onConfirmAll: () => void;
  onRegenerate: () => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const update = (recipe: (draft: ExtractedProjectContext) => void) => {
    const next = cloneExtraction(extracted);
    recipe(next);
    onUpdate(next);
  };

  return (
    <StepFrame
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <SecondaryButton onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </SecondaryButton>
            <SecondaryButton onClick={onRegenerate}>
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </SecondaryButton>
          </div>
          <div className="flex flex-wrap gap-3">
            <SecondaryButton onClick={onConfirmAll}>
              <CheckCircle2 className="h-4 w-4" />
              Confirm All
            </SecondaryButton>
            <PrimaryButton onClick={onContinue}>
              Generate Control Baseline
              <ArrowRight className="h-4 w-4" />
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <div className="mb-5 rounded-lg border border-[#24486F] bg-[#07192D] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-[22px] font-black text-white">Review & Correct AI Extraction</h3>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[#9DBBE0]">
              The AI has made the document extraction reviewable before it becomes a live control model. Adjust only what the kickoff team would actually challenge.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ConfidenceBadge value={extracted.confidence} />
            {extracted.confirmationCount > 0 ? <NeedsConfirmationBadge /> : null}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ['Source', extracted.sourceName],
            ['Detected budget', formatMoney(extracted.budget.approvedBudget.value)],
            ['Handover target', formatDate(extracted.project.targetHandover.value)],
            ['Review status', extracted.confirmationCount ? `${extracted.confirmationCount} confirmations` : 'All confirmed'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[#24486F] bg-[#061529] px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#6F89AA]">{label}</p>
              <p className="mt-1 truncate text-[12px] font-black text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <SourceAuditStrip extracted={extracted} />

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionShell title="Property" right={<><SourcePill>LOA header</SourcePill> <ConfidenceBadge value={extracted.property.name.confidence} /></>}>
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="Property name" value={extracted.property.name.value} onChange={value => update(draft => { draft.property.name.value = value; })} />
            <TextInput label="Location" value={extracted.property.location.value} onChange={value => update(draft => { draft.property.location.value = value; })} />
            <TextInput label="Property type" value={extracted.property.type.value} onChange={value => update(draft => { draft.property.type.value = value; })} />
            <TextInput label="Floors" type="number" value={extracted.property.floors.value} onChange={value => update(draft => { draft.property.floors.value = Number(value) || 0; })} />
            <TextInput label="Units" type="number" value={extracted.property.units.value} onChange={value => update(draft => { draft.property.units.value = Number(value) || 0; })} />
          </div>
        </SectionShell>

        <SectionShell title="Project" right={<><SourcePill>Award scope</SourcePill> <ConfidenceBadge value={extracted.project.name.confidence} /></>}>
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="Project name" value={extracted.project.name.value} onChange={value => update(draft => { draft.project.name.value = value; })} />
            <TextInput label="Project type" value={extracted.project.type.value} onChange={value => update(draft => { draft.project.type.value = value; })} />
            <TextInput label="Contract value" type="number" value={extracted.project.contractValue.value} onChange={value => update(draft => { draft.project.contractValue.value = Number(value) || 0; draft.budget.approvedBudget.value = Number(value) || 0; })} />
            <TextInput label="Target handover" type="date" value={extracted.project.targetHandover.value} helper={`Parsed as ${formatDate(extracted.project.targetHandover.value)}`} onChange={value => update(draft => { draft.project.targetHandover.value = value; })} />
            <TextInput label="Current stage" value={extracted.project.currentStage.value} onChange={value => update(draft => { draft.project.currentStage.value = value; })} />
            <TextInput label="Main contractor" value={extracted.project.mainContractor.value} onChange={value => update(draft => { draft.project.mainContractor.value = value; })} />
          </div>
        </SectionShell>

        <SectionShell title="Budget" right={<><SourcePill>Contract value</SourcePill> <ConfidenceBadge value={extracted.budget.approvedBudget.confidence} /></>}>
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput label="Approved budget" type="number" value={extracted.budget.approvedBudget.value} onChange={value => update(draft => { draft.budget.approvedBudget.value = Number(value) || 0; draft.project.contractValue.value = Number(value) || 0; })} />
            <TextInput label="Currency" value={extracted.budget.currency.value} onChange={value => update(draft => { draft.budget.currency.value = value as 'AED'; })} />
            <TextInput label="Contingency %" type="number" value={extracted.budget.contingency.value} onChange={value => update(draft => { draft.budget.contingency.value = Number(value) || 0; })} />
            <TextInput label="Tracking level" value={extracted.budget.trackingLevel.value} onChange={value => update(draft => { draft.budget.trackingLevel.value = value; })} />
            <TextInput label="Reporting" value={extracted.budget.reporting.value} onChange={value => update(draft => { draft.budget.reporting.value = value; })} />
          </div>
        </SectionShell>

        <SectionShell title="Vendors" right={<><SourcePill>Vendor paragraph</SourcePill> <ConfidenceBadge value={84} /> <NeedsConfirmationBadge /></>}>
          <TextAreaList
            label="One vendor per line, use Name - Scope"
            values={extracted.vendors.map(vendor => `${vendor.name} - ${vendor.scope}`)}
            onChange={values => update(draft => {
              draft.vendors = values.map((line, index) => {
                const [name, scope] = line.split(' - ');
                return {
                  name: name?.trim() || line,
                  scope: scope?.trim() || 'Project vendor',
                  confidence: index === 3 ? 78 : 86,
                  needsConfirmation: index === 3,
                };
              });
            })}
          />
        </SectionShell>

        <SectionShell title="Work Packages" right={<><SourcePill>Package list</SourcePill> <ConfidenceBadge value={extracted.workPackages.confidence} /></>}>
          <TextAreaList label="Detected work packages" values={extracted.workPackages.value} onChange={values => update(draft => { draft.workPackages.value = values; })} />
        </SectionShell>

        <SectionShell title="Milestones" right={<><SourcePill>Dates + inferred gates</SourcePill> <ConfidenceBadge value={extracted.milestones.confidence} /></>}>
          <TextAreaList label="Detected milestones" values={extracted.milestones.value} onChange={values => update(draft => { draft.milestones.value = values; })} />
        </SectionShell>

        <SectionShell title="Risks" right={<><SourcePill>AI risk inference</SourcePill> <ConfidenceBadge value={extracted.risks.confidence} /></>}>
          <TextAreaList label="Early risks" values={extracted.risks.value} onChange={values => update(draft => { draft.risks.value = values; })} />
        </SectionShell>

        <SectionShell title="Obligations & Evidence" right={<><SourcePill>Controls required</SourcePill> <ConfidenceBadge value={extracted.obligations.confidence} /> <NeedsConfirmationBadge /></>}>
          <div className="grid gap-3 md:grid-cols-2">
            <TextAreaList label="Obligations" values={extracted.obligations.value} onChange={values => update(draft => { draft.obligations.value = values; })} />
            <TextAreaList label="Evidence requirements" values={extracted.evidence.value} onChange={values => update(draft => { draft.evidence.value = values; })} />
          </div>
        </SectionShell>
      </div>
    </StepFrame>
  );
}

function ControlBaselineGenerationStep({
  loadingIndex,
  done,
  baseline,
  extracted,
  onBack,
  onLaunch,
}: {
  loadingIndex: number;
  done: boolean;
  baseline: GeneratedProjectControlBaseline | null;
  extracted: ExtractedProjectContext;
  onBack: () => void;
  onLaunch: () => void;
}) {
  if (!done || !baseline) {
    return (
      <StepFrame
        footer={
          <div className="flex justify-between">
            <SecondaryButton onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </SecondaryButton>
          </div>
        }
      >
        <div className="rounded-lg border border-[#24486F] bg-[#07192D] p-6">
          <div className="mb-6 flex items-center gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-emerald-300/35 bg-emerald-500/15 text-emerald-100">
              <Loader2 className="h-6 w-6 animate-spin" />
            </span>
            <div>
              <h3 className="text-[22px] font-black text-white">Generating live project control baseline</h3>
              <p className="mt-1 text-[13px] text-[#9DBBE0]">ProjectCommand is connecting programme, cost, risk, vendors, gates, evidence, and manager decisions.</p>
            </div>
          </div>
          <div className="mb-6 rounded-lg border border-emerald-300/22 bg-emerald-500/8 p-4">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">
              <Layers3 className="h-4 w-4" />
              Control baseline pipeline
            </div>
            <div className="grid gap-2 md:grid-cols-5">
              {baselinePipeline.map((item, index) => {
                const Icon = item.icon;
                const live = index <= Math.floor((loadingIndex / Math.max(baselineSteps.length - 1, 1)) * (baselinePipeline.length - 1));
                return (
                  <div key={item.label} className={`rounded-lg border px-3 py-3 transition ${live ? 'border-emerald-300/35 bg-emerald-500/12 text-white' : 'border-[#24486F] bg-[#061529] text-[#6F89AA]'}`}>
                    <Icon className="mb-2 h-4 w-4" />
                    <p className="text-[11px] font-black">{item.label}</p>
                    <p className="mt-1 text-[10px] font-bold opacity-80">{item.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {baselineSteps.map((item, index) => {
              const complete = index < loadingIndex;
              const active = index === loadingIndex;
              return (
                <div
                  key={item}
                  className={`rounded-lg border p-4 transition ${
                    active
                      ? 'border-emerald-300/70 bg-emerald-500/16 text-white shadow-[0_0_26px_rgba(56,217,138,0.16)]'
                      : complete
                        ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                        : 'border-[#24486F] bg-[#061529] text-[#7E98B8]'
                  }`}
                >
                  <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-md bg-[#102F55]">
                    {complete ? <CheckCircle2 className="h-4 w-4" /> : <WandSparkles className="h-4 w-4" />}
                  </div>
                  <p className="text-[12px] font-black">{item}</p>
                </div>
              );
            })}
          </div>
        </div>
      </StepFrame>
    );
  }

  return (
    <StepFrame
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SecondaryButton onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </SecondaryButton>
          <PrimaryButton onClick={onLaunch}>
            Launch ProjectCommand Overview
            <Rocket className="h-4 w-4" />
          </PrimaryButton>
        </div>
      }
    >
      <div className="rounded-lg border border-emerald-300/30 bg-emerald-500/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <IconBox icon={CheckCircle2} tone="green" />
            <div>
              <h3 className="text-[22px] font-black text-white">Project Control Baseline Ready</h3>
              <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[#B7D5F8]">
                AI converted {baseline.sourceName} into a connected project controls operating model for {extracted.property.name.value}.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <ConfidenceBadge value={baseline.readinessScore} />
            <button
              type="button"
              onPointerDown={event => activatePointer(event, onLaunch)}
              onClick={event => activateClick(event, onLaunch)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-[12px] font-black text-white shadow-lg shadow-blue-950/25 transition hover:bg-blue-400"
            >
              Launch live overview
              <Rocket className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-[#24486F] bg-[#061529] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8FA7C5]">Connected control model</p>
          <SourcePill>Baseline created from extraction, not manual form entry</SourcePill>
        </div>
        <div className="grid gap-2 md:grid-cols-5">
          {baselinePipeline.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-lg border border-[#24486F] bg-[#07192D] px-3 py-3">
                <Icon className="mb-2 h-4 w-4 text-emerald-200" />
                <p className="text-[11px] font-black text-white">{item.label}</p>
                <p className="mt-1 text-[10px] font-bold text-[#8FB4E4]">{item.detail}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <BaselineSummaryCard icon={ClipboardCheck} label="Work Packages Created" value={`${baseline.workPackagesCreated}`} detail="Delivery packages are mapped to programme, cost, risk, and vendor ownership." />
        <BaselineSummaryCard icon={Database} label="Stage Gates Created" value={`${baseline.stageGatesCreated}`} detail="Control gates now link approvals, evidence, milestones, and decisions." />
        <BaselineSummaryCard icon={FileText} label="Evidence Requirements Added" value={`${baseline.evidenceRequirementsAdded}`} detail="Authority, inspection, commissioning, fire, lift, warranty, and handover proof is tracked." />
        <BaselineSummaryCard icon={BrainCircuit} label="Risks Seeded" value={`${baseline.risksSeeded}`} detail="Early risk register is tied to facade, crane, authority, MEP, and summer productivity exposure." />
        <BaselineSummaryCard icon={Sparkles} label="Vendors Mapped" value={`${baseline.vendorsMapped}`} detail="Main contractor and specialist vendors are ready for score, issue, and recovery tracking." />
        <BaselineSummaryCard icon={Rocket} label="Budget Baseline Created" value={baseline.budgetBaselineLabel} detail={`Approved budget: ${formatMoney(extracted.budget.approvedBudget.value)} with ${extracted.budget.contingency.value}% contingency.`} />
      </div>

      <section className="mt-5 rounded-lg border border-[#24486F] bg-[#07192D] p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8FA7C5]">AI Top Threat</p>
        <p className="mt-2 text-[18px] font-black leading-snug text-white">{baseline.topThreat}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {baseline.initialManagerActions.map(action => (
            <div key={action} className="rounded-lg border border-[#24486F] bg-[#061529] p-3">
              <p className="text-[12px] font-black text-white">{action}</p>
              <p className="mt-1 text-[12px] text-[#8FB4E4]">Queued as a manager action after launch.</p>
            </div>
          ))}
        </div>
      </section>
    </StepFrame>
  );
}

function LaunchStep({ onLaunch, onBack }: { onLaunch: () => void; onBack: () => void }) {
  return (
    <StepFrame
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SecondaryButton onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </SecondaryButton>
          <PrimaryButton onClick={onLaunch}>
            Open ProjectCommand Overview
            <Rocket className="h-4 w-4" />
          </PrimaryButton>
        </div>
      }
    >
      <div className="overflow-hidden rounded-lg border border-blue-300/30 bg-[radial-gradient(circle_at_50%_0%,rgba(46,127,255,0.24),transparent_36%),linear-gradient(180deg,rgba(46,127,255,0.12),rgba(6,21,41,0.96))] p-8 text-center">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-300/35 bg-blue-500/15 text-blue-100 shadow-[0_0_34px_rgba(47,124,255,0.24)]">
          <Rocket className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-[24px] font-black text-white">ProjectCommand is ready with a populated baseline</h3>
        <p className="mx-auto mt-2 max-w-2xl text-[13px] leading-relaxed text-[#B7D5F8]">
          The overview opens with the Sobha Pilot Tower control story already alive: health score, KPI causes, top threat, What Changed Today, forecast scenarios, and AI manager actions.
        </p>
        <div className="mx-auto mt-6 grid max-w-4xl gap-3 md:grid-cols-4">
          {[
            ['Health', '74/100'],
            ['Completion', '28%'],
            ['CPI / SPI', '0.81 / 0.90'],
            ['Float', '12d'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[#24486F] bg-[#061529]/82 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7E98B8]">{label}</p>
              <p className="mt-1 text-[18px] font-black text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-5 max-w-3xl rounded-lg border border-[#24486F] bg-[#061529]/82 px-4 py-3 text-left">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8FA7C5]">First feed item</p>
          <p className="mt-1 text-[13px] font-black text-white">Project baseline created from uploaded LOA/project summary.</p>
          <p className="mt-1 text-[12px] text-[#8FB4E4]">This becomes the first live cause behind the overview metrics.</p>
        </div>
      </div>
    </StepFrame>
  );
}

function CreateProjectModal({
  onClose,
  onCreate,
  onToast,
}: {
  onClose: () => void;
  onCreate: (dataset: ProjectCommandDataset) => void;
  onToast?: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}) {
  const [step, setStep] = useState<CreateProjectStep>('import');
  const [material, setMaterial] = useState<ProjectMaterialState>({
    fileName: '',
    documentText: '',
    parserMethod: '',
    parserWarning: '',
    fileParseStatus: 'idle',
    pastedText: '',
    useSample: false,
    manual: false,
  });
  const [extracted, setExtracted] = useState<ExtractedProjectContext | null>(null);
  const [baseline, setBaseline] = useState<GeneratedProjectControlBaseline | null>(null);
  const [understandingIndex, setUnderstandingIndex] = useState(0);
  const [understandingDone, setUnderstandingDone] = useState(false);
  const [baselineIndex, setBaselineIndex] = useState(0);
  const [baselineDone, setBaselineDone] = useState(false);

  const subtitle = useMemo(() => {
    if (step === 'import') return 'Start from real project material, not a blank form.';
    if (step === 'understanding') return 'AI extracts construction signals from the imported context.';
    if (step === 'review') return 'Confirm the extracted property, project, cost, vendor, risk, and evidence structure.';
    if (step === 'baseline') return 'Generate the connected project controls baseline.';
    return 'Launch into the live ProjectCommand operating layer.';
  }, [step]);

  useEffect(() => {
    if (step !== 'understanding' || understandingDone) return;

    let cancelled = false;
    setUnderstandingIndex(0);

    const interval = window.setInterval(() => {
      setUnderstandingIndex(current => {
        if (current >= extractionSteps.length - 1) {
          window.clearInterval(interval);
          extractProjectContext({
            fileName: material.fileName || undefined,
            documentText: material.documentText,
            parserMethod: material.parserMethod,
            parserWarning: material.parserWarning,
            pastedText: material.pastedText,
            useSample: material.useSample,
            manual: material.manual,
          }).then(result => {
            if (!cancelled) {
              setExtracted(result);
              setUnderstandingDone(true);
            }
          });
          return current;
        }
        return current + 1;
      });
    }, 360);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [material.documentText, material.fileName, material.manual, material.parserMethod, material.parserWarning, material.pastedText, material.useSample, step, understandingDone]);

  useEffect(() => {
    if (step !== 'baseline' || baselineDone || !extracted) return;

    let cancelled = false;
    setBaselineIndex(0);

    const interval = window.setInterval(() => {
      setBaselineIndex(current => {
        if (current >= baselineSteps.length - 1) {
          window.clearInterval(interval);
          if (!cancelled) {
            setBaseline(generateProjectControlBaseline(extracted));
            setBaselineDone(true);
          }
          return current;
        }
        return current + 1;
      });
    }, 360);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [baselineDone, extracted, step]);

  const startUnderstanding = (nextMaterial?: Partial<ProjectMaterialState>) => {
    setMaterial(current => ({ ...current, ...nextMaterial }));
    setUnderstandingDone(false);
    setBaselineDone(false);
    setBaseline(null);
    setStep('understanding');
  };

  const handleFileSelection = async (file: File) => {
    setUnderstandingDone(false);
    setBaselineDone(false);
    setBaseline(null);
    setExtracted(null);
    setMaterial(current => ({
      ...current,
      fileName: file.name,
      documentText: '',
      parserMethod: '',
      parserWarning: '',
      fileParseStatus: 'reading',
      useSample: false,
      manual: false,
    }));

    try {
      const parsed = await parseProjectDocumentFile(file);
      const hasUsefulText = parsed.text.trim().length >= 80;
      setMaterial(current => ({
        ...current,
        fileName: parsed.fileName,
        documentText: parsed.text,
        parserMethod: parsed.method,
        parserWarning: parsed.warning ?? '',
        fileParseStatus: hasUsefulText && !parsed.warning ? 'ready' : hasUsefulText ? 'limited' : 'error',
        useSample: false,
        manual: false,
      }));
      onToast?.(
        hasUsefulText
          ? `${parsed.fileName}: extracted ${parsed.text.length.toLocaleString()} readable characters`
          : `${parsed.fileName}: upload received, but readable text is limited`,
        hasUsefulText ? 'success' : 'warning',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Document parser failed.';
      setMaterial(current => ({
        ...current,
        fileName: file.name,
        documentText: '',
        parserMethod: 'unsupported',
        parserWarning: message,
        fileParseStatus: 'error',
        useSample: false,
        manual: false,
      }));
      onToast?.(`${file.name}: ${message}`, 'warning');
    }
  };

  const confirmAll = () => {
    if (!extracted) return;
    const next = cloneExtraction(extracted);
    next.confirmationCount = 0;
    next.extractionSignals = next.extractionSignals.map(signal => ({ ...signal, needsConfirmation: false, confidence: Math.max(signal.confidence, 90) }));
    next.vendors = next.vendors.map(vendor => ({ ...vendor, needsConfirmation: false, confidence: Math.max(vendor.confidence, 90) }));
    next.obligations.status = 'high';
    next.evidence.status = 'high';
    setExtracted(next);
  };

  const handleLaunch = () => {
    if (!extracted || !baseline) return;
    const dataset = buildProjectCommandDatasetFromExtraction(extracted, baseline);
    onCreate(dataset);
    onToast?.('ProjectCommand launched from uploaded LOA/project summary', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 18 }}
        transition={{ duration: 0.18 }}
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-[#2A527D] bg-[#061426] shadow-2xl shadow-black/45"
      >
        <header className="border-b border-[#1E3C61] bg-[#07192D] px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <IconBox icon={WandSparkles} tone="blue" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8FA7C5]">Create New Project</p>
                <h2 className="mt-1 text-[24px] font-black text-white">AI Project Control Baseline</h2>
                <p className="mt-2 text-[13px] text-[#9DBBE0]">{subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close create project modal"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#24486F] bg-[#061529] text-[#9BB4D4] transition hover:border-red-300/50 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-5">
            <WizardProgress currentStep={step} />
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col p-5">
          <AnimatePresence mode="wait">
            {step === 'import' && (
              <ProjectContextImportStep
                key="import"
                material={material}
                onFile={file => void handleFileSelection(file)}
                onUseSample={() => startUnderstanding({ fileName: 'Sobha Pilot Tower LOA / Project Summary.pdf', documentText: sampleSobhaPilotBrief, parserMethod: 'sample-document', parserWarning: '', fileParseStatus: 'ready', pastedText: sampleSobhaPilotBrief, useSample: true, manual: false })}
                onManual={() => startUnderstanding({ fileName: '', documentText: '', parserMethod: 'manual', parserWarning: '', fileParseStatus: 'idle', pastedText: '', manual: true, useSample: false })}
                onContinue={() => startUnderstanding()}
              />
            )}

            {step === 'understanding' && (
              <AIProjectUnderstandingStep
                key="understanding"
                loadingIndex={understandingIndex}
                done={understandingDone}
                extracted={extracted}
                sourceName={material.fileName || (material.pastedText.trim() ? 'Pasted project brief' : 'Manual project context')}
                onBack={() => setStep('import')}
                onContinue={() => setStep('review')}
              />
            )}

            {step === 'review' && extracted && (
              <ExtractedProjectReviewStep
                key="review"
                extracted={extracted}
                onUpdate={setExtracted}
                onConfirmAll={confirmAll}
                onRegenerate={() => {
                  setUnderstandingDone(false);
                  setStep('understanding');
                }}
                onBack={() => setStep('understanding')}
                onContinue={() => {
                  setBaselineDone(false);
                  setStep('baseline');
                }}
              />
            )}

            {step === 'baseline' && extracted && (
              <ControlBaselineGenerationStep
                key="baseline"
                loadingIndex={baselineIndex}
                done={baselineDone}
                baseline={baseline}
                extracted={extracted}
                onBack={() => setStep('review')}
                onLaunch={handleLaunch}
              />
            )}

            {step === 'launch' && <LaunchStep key="launch" onBack={() => setStep('baseline')} onLaunch={handleLaunch} />}
          </AnimatePresence>
        </main>
      </motion.div>
    </div>
  );
}

export function AddProjectModal(props: {
  onClose: () => void;
  onCreate: (dataset: ProjectCommandDataset) => void;
  onToast?: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}) {
  return <CreateProjectModal {...props} />;
}
