import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, ArrowRight, CheckCircle, AlertTriangle,
  RotateCcw, Loader2, Edit3, ChevronDown, MapPin, User,
  QrCode, Zap, Shield, Clock, ExternalLink, X,
} from 'lucide-react';

type Step = 'onboarding' | 'capture' | 'analyzing' | 'review' | 'submitting' | 'success' | 'manual';

interface AiAnalysis {
  title: string;
  description: string;
  issueType: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  identifiedAsset: string;
  observations: string[];
  recommendedAction: string;
  confidence: number;
}

interface SubmittedIncident {
  id: string;
  title: string;
  severity: string;
  category: string;
  assignedTech: string | null;
  eta: string | null;
}

interface Props {
  siteId: string;
  assetId: string;
  onIncidentCreated: (incident: {
    id: string;
    title: string;
    location: string;
    severity: string;
    slaMinutes: number;
    elapsed: number;
    source: string;
    status: string;
    assignedTech: string | null;
    techId: string | null;
    closureNotes: null;
    description: string;
    activityLog: { time: string; event: string; type: string }[];
    imageUrl?: string;
    aiMetadata?: AiAnalysis & { reporterName?: string; reporterRole?: string; siteId?: string; assetId?: string };
  }) => void;
}

const ROLES = ['Cleaner', 'Tenant', 'Security', 'Inspector', 'Visitor', 'Other'];

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  critical: { bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/40',    label: 'Critical' },
  high:     { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/40', label: 'High' },
  medium:   { bg: 'bg-amber-500/15',  text: 'text-amber-400',  border: 'border-amber-500/40',  label: 'Medium' },
  low:      { bg: 'bg-emerald-500/15',text: 'text-emerald-400',border: 'border-emerald-500/40',label: 'Low' },
};

const SLA_MINUTES: Record<string, number> = {
  critical: 45, high: 60, medium: 120, low: 240,
};

function generateIncidentId() {
  const num = String(Math.floor(Math.random() * 900) + 100);
  return `INC-QR-${num}`;
}

function now() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function SiteHeader({ siteId, assetId }: { siteId: string; assetId: string }) {
  const siteName = siteId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Silicon Oasis';
  const assetName = assetId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Community Area';
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[rgba(46,127,255,0.08)] border-b border-[rgba(46,127,255,0.15)]">
      <QrCode size={13} className="text-[#2E7FFF] flex-shrink-0" />
      <div className="text-[11px] text-[#7A94B4] truncate">
        <span className="text-[#EEF3FA] font-medium">{siteName}</span>
        {assetId && assetId !== 'general' && (
          <> · <span>{assetName}</span></>
        )}
      </div>
    </div>
  );
}

function OnboardingStep({
  siteId, assetId, onContinue,
}: { siteId: string; assetId: string; onContinue: (name: string, role: string) => void }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const siteName = siteId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Silicon Oasis';

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <SiteHeader siteId={siteId} assetId={assetId} />
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(46,127,255,0.15)] border border-[rgba(46,127,255,0.3)] flex items-center justify-center">
            <AlertTriangle size={28} className="text-[#2E7FFF]" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Report an Issue
            </h1>
            <p className="text-[13px] text-[#7A94B4] mt-1">
              {siteName} · AI-powered incident capture
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <div className="grid grid-cols-3 gap-2 p-3 bg-[rgba(17,32,64,0.6)] border border-[rgba(46,127,255,0.15)] rounded-xl">
            {[
              { icon: <Camera size={14} />, label: 'Take Photo' },
              { icon: <Zap size={14} />, label: 'AI Analysis' },
              { icon: <Shield size={14} />, label: 'Instant Report' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-8 h-8 rounded-lg bg-[rgba(46,127,255,0.12)] flex items-center justify-center text-[#2E7FFF]">
                  {icon}
                </div>
                <span className="text-[10px] text-[#7A94B4] leading-tight">{label}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="text-[11px] text-[#7A94B4] uppercase tracking-wide mb-1.5 block">
              Your Name <span className="text-[#7A94B4] normal-case tracking-normal">(optional)</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Ahmed Al-Rashidi"
              className="w-full bg-[#112040] border border-[rgba(46,127,255,0.25)] rounded-xl px-4 py-3 text-[14px] text-[#EEF3FA] placeholder-[#7A94B4] outline-none focus:border-[#2E7FFF] transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] text-[#7A94B4] uppercase tracking-wide mb-1.5 block">
              Your Role <span className="text-[#7A94B4] normal-case tracking-normal">(optional)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => setRole(prev => prev === r ? '' : r)}
                  className={`py-2.5 px-2 rounded-xl text-[12px] font-medium border transition-all ${
                    role === r
                      ? 'bg-[rgba(46,127,255,0.2)] border-[#2E7FFF] text-[#EEF3FA]'
                      : 'bg-[#112040] border-[rgba(46,127,255,0.2)] text-[#7A94B4] hover:text-[#EEF3FA]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => onContinue(name, role)}
          className="w-full max-w-sm flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#2E7FFF] text-white font-semibold text-[15px] hover:bg-blue-500 active:scale-[0.98] transition-all"
        >
          Continue
          <ArrowRight size={18} />
        </button>

        <p className="text-[10px] text-[#7A94B4] text-center max-w-xs">
          No login required. Your report is anonymous unless you provide your name.
        </p>
      </div>
    </div>
  );
}

function CaptureStep({
  onAnalyze, onBack,
}: { onAnalyze: (file: File) => void; onBack: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const retake = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(46,127,255,0.15)]">
        <button onClick={onBack} className="text-[#7A94B4] hover:text-[#EEF3FA] transition-colors">
          <X size={18} />
        </button>
        <div>
          <div className="text-[13px] font-semibold text-[#EEF3FA]">Capture Issue Photo</div>
          <div className="text-[11px] text-[#7A94B4]">Step 2 of 4</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center p-6 gap-5">
        {!preview ? (
          <>
            <div className="w-full max-w-sm aspect-[4/3] rounded-2xl border-2 border-dashed border-[rgba(46,127,255,0.3)] bg-[rgba(17,32,64,0.5)] flex flex-col items-center justify-center gap-3 text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(46,127,255,0.1)] flex items-center justify-center">
                <Camera size={26} className="text-[#2E7FFF]" />
              </div>
              <div>
                <p className="text-[14px] text-[#EEF3FA] font-medium">Take or upload a photo</p>
                <p className="text-[12px] text-[#7A94B4] mt-1">Show the issue clearly. AI works best with good lighting.</p>
              </div>
            </div>

            <div className="w-full max-w-sm space-y-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#2E7FFF] text-white font-semibold text-[15px] hover:bg-blue-500 active:scale-[0.98] transition-all"
              >
                <Camera size={20} />
                Open Camera
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#112040] border border-[rgba(46,127,255,0.3)] text-[#EEF3FA] font-semibold text-[15px] hover:bg-[rgba(46,127,255,0.1)] active:scale-[0.98] transition-all"
              >
                <Upload size={20} />
                Upload from Gallery
              </button>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            <p className="text-[11px] text-[#7A94B4] text-center">
              Supported: JPEG, PNG, WebP · Max 10 MB
            </p>
          </>
        ) : (
          <>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-[rgba(46,127,255,0.25)]">
              <img src={preview} alt="Issue preview" className="w-full object-cover max-h-64" />
            </div>

            <div className="w-full max-w-sm space-y-3">
              <button
                onClick={() => selectedFile && onAnalyze(selectedFile)}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#2E7FFF] text-white font-semibold text-[15px] hover:bg-blue-500 active:scale-[0.98] transition-all"
              >
                <Zap size={20} />
                Analyze with AI
              </button>
              <button
                onClick={retake}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-[#112040] border border-[rgba(46,127,255,0.2)] text-[#7A94B4] text-[14px] hover:text-[#EEF3FA] transition-all"
              >
                <RotateCcw size={16} />
                Retake Photo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AnalyzingStep() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        className="w-16 h-16 rounded-2xl bg-[rgba(46,127,255,0.15)] border border-[rgba(46,127,255,0.3)] flex items-center justify-center"
      >
        <Loader2 size={28} className="text-[#2E7FFF]" />
      </motion.div>
      <div className="text-center">
        <p className="text-[18px] font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Analyzing with AI
        </p>
        <p className="text-[13px] text-[#7A94B4] mt-1">
          GPT-4o Vision is classifying your issue…
        </p>
      </div>
      <div className="w-full max-w-xs space-y-2">
        {['Detecting issue type', 'Assessing severity', 'Generating report'].map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.5 }}
            className="flex items-center gap-2 text-[12px] text-[#7A94B4]"
          >
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.5 }}
              className="w-1.5 h-1.5 rounded-full bg-cyan-400"
            />
            {step}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ReviewStep({
  analysis, imageUrl, onSubmit, onRetake,
}: {
  analysis: AiAnalysis;
  imageUrl: string;
  onSubmit: (edited: Partial<AiAnalysis> & { note: string }) => void;
  onRetake: () => void;
}) {
  const [title, setTitle]       = useState(analysis.title);
  const [description, setDesc]  = useState(analysis.description);
  const [severity, setSeverity] = useState(analysis.severity);
  const [note, setNote]         = useState('');
  const [editTitle, setEditTitle]   = useState(false);
  const [editDesc, setEditDesc]     = useState(false);

  const sev = SEVERITY_COLORS[severity];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <div className="flex items-center gap-2 flex-1">
          <Zap size={14} className="text-cyan-400" />
          <div className="text-[13px] font-semibold text-[#EEF3FA]">AI Analysis Result</div>
        </div>
        <span className="text-[11px] text-[#7A94B4]">Step 3 of 4</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-xl overflow-hidden border border-[rgba(46,127,255,0.2)]">
          <img src={imageUrl} alt="Issue" className="w-full object-cover max-h-40" />
        </div>

        <div className="p-3 bg-[rgba(46,127,255,0.08)] border border-[rgba(46,127,255,0.2)] rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Zap size={12} className="text-cyan-400" />
              <span className="text-[11px] text-cyan-400 font-bold">4C360 AI Classification</span>
            </div>
            <span className={`text-[11px] font-bold ${analysis.confidence >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {analysis.confidence}% confidence
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${sev.bg} ${sev.text} ${sev.border}`}>
              {sev.label}
            </span>
            <span className="text-[11px] text-[#7A94B4]">{analysis.category}</span>
            <span className="text-[10px] text-[#7A94B4]">·</span>
            <span className="text-[11px] text-[#7A94B4]">{analysis.issueType}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Title</label>
            <button onClick={() => setEditTitle(v => !v)} className="text-[#2E7FFF] hover:text-blue-400 transition-colors">
              <Edit3 size={12} />
            </button>
          </div>
          {editTitle ? (
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#112040] border border-[#2E7FFF] rounded-xl px-3 py-2 text-[14px] text-[#EEF3FA] outline-none"
              autoFocus
            />
          ) : (
            <p className="text-[15px] text-[#EEF3FA] font-semibold">{title}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Description</label>
            <button onClick={() => setEditDesc(v => !v)} className="text-[#2E7FFF] hover:text-blue-400 transition-colors">
              <Edit3 size={12} />
            </button>
          </div>
          {editDesc ? (
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              className="w-full bg-[#112040] border border-[#2E7FFF] rounded-xl px-3 py-2 text-[13px] text-[#EEF3FA] outline-none resize-none"
              autoFocus
            />
          ) : (
            <p className="text-[13px] text-[#7A94B4] leading-relaxed">{description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Identified Asset', value: analysis.identifiedAsset },
            { label: 'Recommended Action', value: analysis.recommendedAction },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#0A1628] rounded-lg p-2.5">
              <div className="text-[9px] text-[#7A94B4] uppercase tracking-wide mb-0.5">{label}</div>
              <div className="text-[11px] text-[#EEF3FA]">{value}</div>
            </div>
          ))}
        </div>

        <div>
          <label className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5 block">Severity</label>
          <div className="grid grid-cols-4 gap-2">
            {(['critical', 'high', 'medium', 'low'] as const).map(s => {
              const sc = SEVERITY_COLORS[s];
              return (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`py-2 rounded-lg text-[11px] font-semibold border capitalize transition-all ${
                    severity === s ? `${sc.bg} ${sc.text} ${sc.border}` : 'bg-[#112040] border-[rgba(46,127,255,0.2)] text-[#7A94B4]'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {analysis.observations.length > 0 && (
          <div>
            <label className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5 block">Observations</label>
            <div className="space-y-1.5">
              {analysis.observations.map((obs, i) => (
                <div key={i} className="flex items-start gap-2 text-[12px] text-[#7A94B4]">
                  <span className="text-cyan-400 flex-shrink-0 mt-0.5">·</span>
                  {obs}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-[10px] text-[#7A94B4] uppercase tracking-wide mb-1.5 block">
            Additional Note <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add any details the AI may have missed…"
            rows={2}
            className="w-full bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-xl px-3 py-2 text-[13px] text-[#EEF3FA] placeholder-[#7A94B4] outline-none resize-none focus:border-[#2E7FFF] transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pb-2">
          <button
            onClick={onRetake}
            className="py-3.5 rounded-2xl bg-[#112040] border border-[rgba(46,127,255,0.2)] text-[#7A94B4] text-[14px] font-medium hover:text-[#EEF3FA] transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={15} />
            Retake
          </button>
          <button
            onClick={() => onSubmit({ title, description, severity, note })}
            className="py-3.5 rounded-2xl bg-[#2E7FFF] text-white text-[14px] font-semibold hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={15} />
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function ManualFallbackStep({
  imageUrl, onSubmit, onRetake,
}: { imageUrl?: string; onSubmit: (data: { title: string; description: string; severity: string; category: string; note: string }) => void; onRetake: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDesc] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');

  const canSubmit = title.trim().length > 0;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(46,127,255,0.15)] flex-shrink-0">
        <div className="flex items-center gap-2 flex-1">
          <AlertTriangle size={14} className="text-amber-400" />
          <div className="text-[13px] font-semibold text-[#EEF3FA]">Describe the Issue</div>
        </div>
        <span className="text-[11px] text-[#7A94B4]">Manual Entry</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2">
          <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-amber-400">AI analysis unavailable — please describe the issue manually.</p>
        </div>

        {imageUrl && (
          <div className="rounded-xl overflow-hidden border border-[rgba(46,127,255,0.2)]">
            <img src={imageUrl} alt="Issue" className="w-full object-cover max-h-36" />
          </div>
        )}

        <div>
          <label className="text-[11px] text-[#7A94B4] uppercase tracking-wide mb-1.5 block">Issue Title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Water leak under kitchen sink"
            className="w-full bg-[#112040] border border-[rgba(46,127,255,0.25)] rounded-xl px-4 py-3 text-[14px] text-[#EEF3FA] placeholder-[#7A94B4] outline-none focus:border-[#2E7FFF] transition-colors"
          />
        </div>

        <div>
          <label className="text-[11px] text-[#7A94B4] uppercase tracking-wide mb-1.5 block">Description</label>
          <textarea
            value={description}
            onChange={e => setDesc(e.target.value)}
            placeholder="Describe the problem in detail…"
            rows={3}
            className="w-full bg-[#112040] border border-[rgba(46,127,255,0.25)] rounded-xl px-4 py-3 text-[13px] text-[#EEF3FA] placeholder-[#7A94B4] outline-none resize-none focus:border-[#2E7FFF] transition-colors"
          />
        </div>

        <div>
          <label className="text-[11px] text-[#7A94B4] uppercase tracking-wide mb-1.5 block">Severity</label>
          <div className="grid grid-cols-4 gap-2">
            {(['critical', 'high', 'medium', 'low'] as const).map(s => {
              const sc = SEVERITY_COLORS[s];
              return (
                <button key={s} onClick={() => setSeverity(s)}
                  className={`py-2.5 rounded-xl text-[11px] font-semibold border capitalize transition-all ${
                    severity === s ? `${sc.bg} ${sc.text} ${sc.border}` : 'bg-[#112040] border-[rgba(46,127,255,0.2)] text-[#7A94B4]'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-[11px] text-[#7A94B4] uppercase tracking-wide mb-1.5 block">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {['HVAC', 'Plumbing', 'Electrical', 'Safety', 'Structural', 'General'].map(c => (
              <button key={c} onClick={() => setCategory(prev => prev === c ? '' : c)}
                className={`py-2.5 rounded-xl text-[11px] font-medium border transition-all ${
                  category === c
                    ? 'bg-[rgba(46,127,255,0.2)] border-[#2E7FFF] text-[#EEF3FA]'
                    : 'bg-[#112040] border-[rgba(46,127,255,0.2)] text-[#7A94B4]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] text-[#7A94B4] uppercase tracking-wide mb-1.5 block">Additional Note</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Any other details…"
            rows={2}
            className="w-full bg-[#112040] border border-[rgba(46,127,255,0.2)] rounded-xl px-4 py-3 text-[13px] text-[#EEF3FA] placeholder-[#7A94B4] outline-none resize-none focus:border-[#2E7FFF] transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pb-2">
          <button
            onClick={onRetake}
            className="py-3.5 rounded-2xl bg-[#112040] border border-[rgba(46,127,255,0.2)] text-[#7A94B4] text-[14px] font-medium hover:text-[#EEF3FA] transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={15} />
            Back
          </button>
          <button
            onClick={() => onSubmit({ title, description, severity, category, note })}
            disabled={!canSubmit}
            className="py-3.5 rounded-2xl bg-[#2E7FFF] text-white text-[14px] font-semibold hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle size={15} />
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessStep({
  incident, onTrack,
}: { incident: SubmittedIncident; onTrack: () => void }) {
  const sev = SEVERITY_COLORS[incident.severity] ?? SEVERITY_COLORS['medium'];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center"
      >
        <CheckCircle size={36} className="text-emerald-400" />
      </motion.div>

      <div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[22px] font-bold text-[#EEF3FA]"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          Issue Reported!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-[13px] text-[#7A94B4] mt-1"
        >
          Your incident has been logged and is being actioned.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="w-full max-w-sm bg-[#112040] border border-[rgba(46,127,255,0.25)] rounded-2xl p-4 text-left space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Incident ID</span>
          <span className="text-[13px] font-bold text-[#2E7FFF] font-mono">{incident.id}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Status</span>
          <span className="text-[11px] text-emerald-400 font-semibold">Open · Logged</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Severity</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${sev.bg} ${sev.text} ${sev.border}`}>
            {incident.severity}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Category</span>
          <span className="text-[12px] text-[#EEF3FA]">{incident.category}</span>
        </div>
        {incident.assignedTech && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide">Assigned To</span>
            <span className="text-[12px] text-[#EEF3FA]">{incident.assignedTech}</span>
          </div>
        )}
        {incident.eta && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#7A94B4] uppercase tracking-wide">ETA</span>
            <div className="flex items-center gap-1 text-[12px] text-amber-400">
              <Clock size={11} />
              {incident.eta}
            </div>
          </div>
        )}
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={onTrack}
        className="w-full max-w-sm flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#2E7FFF] text-white font-semibold text-[15px] hover:bg-blue-500 active:scale-[0.98] transition-all"
      >
        <ExternalLink size={18} />
        Track Issue in Dashboard
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-[11px] text-[#7A94B4]"
      >
        The FM team has been notified and will respond within the SLA window.
      </motion.p>
    </div>
  );
}

const TECH_POOL = [
  { name: 'Karim R.', id: 'KR', skills: ['HVAC', 'General'], eta: '8 min' },
  { name: 'Sara M.',  id: 'SM', skills: ['Electrical', 'Safety'], eta: '12 min' },
  { name: 'Ahmed K.', id: 'AK', skills: ['Plumbing', 'General'], eta: '15 min' },
  { name: 'Faisal N.',id: 'FN', skills: ['Plumbing', 'General'], eta: '10 min' },
];

function autoDispatch(category: string): { name: string; id: string; eta: string } | null {
  const cat = category.toLowerCase();
  const match = TECH_POOL.find(t =>
    t.skills.some(s => s.toLowerCase() === cat || cat.includes(s.toLowerCase()))
  );
  return match ? { name: match.name, id: match.id, eta: match.eta } : null;
}

export function ScanPage({ siteId, assetId, onIncidentCreated }: Props) {
  const [step, setStep] = useState<Step>('onboarding');
  const [reporterName, setReporterName] = useState('');
  const [reporterRole, setReporterRole] = useState('');
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [submittedIncident, setSubmittedIncident] = useState<SubmittedIncident | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiBase = window.location.origin + '/api';

  const handleAnalyze = useCallback(async (file: File) => {
    setCapturedFile(file);
    setStep('analyzing');
    setError(null);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('siteId', siteId);
    formData.append('assetId', assetId);
    formData.append('reporterName', reporterName);
    formData.append('reporterRole', reporterRole);

    try {
      const res = await fetch(`${apiBase}/ai/analyze-issue-image`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json() as {
        success: boolean;
        imageUrl?: string;
        analysis?: AiAnalysis;
        error?: string;
        fallback?: boolean;
      };

      if (data.imageUrl) {
        const imgUrl = window.location.origin + data.imageUrl;
        setUploadedImageUrl(imgUrl);
      } else {
        setUploadedImageUrl(URL.createObjectURL(file));
      }

      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);
        setStep('review');
      } else {
        setStep('manual');
      }
    } catch {
      setUploadedImageUrl(URL.createObjectURL(file));
      setStep('manual');
    }
  }, [siteId, assetId, reporterName, reporterRole, apiBase]);

  const buildAndSubmit = useCallback((
    title: string,
    description: string,
    severity: string,
    category: string,
    note: string,
    aiMeta?: AiAnalysis,
  ) => {
    setStep('submitting');

    const id = generateIncidentId();
    const siteLabel = siteId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Silicon Oasis';
    const assetLabel = assetId && assetId !== 'general'
      ? assetId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'Community Area';
    const location = `${assetLabel}, ${siteLabel}`;
    const t = now();
    const slaMinutes = SLA_MINUTES[severity] ?? 120;
    const tech = autoDispatch(category);

    const activityLog: { time: string; event: string; type: string }[] = [
      { time: t, event: `Issue captured via QR Scan${reporterName ? ` by ${reporterName}` : ''}${reporterRole ? ` (${reporterRole})` : ''}`, type: 'incident' },
      { time: t, event: `AI classified: ${category} · ${severity.charAt(0).toUpperCase() + severity.slice(1)} · ${slaMinutes} min SLA`, type: 'ai' },
    ];
    if (note) {
      activityLog.push({ time: t, event: `Reporter note: ${note}`, type: 'update' });
    }
    if (tech) {
      activityLog.push({ time: t, event: `${tech.name} auto-dispatched · ETA ${tech.eta}`, type: 'dispatch' });
    }

    const incident = {
      id,
      title,
      location,
      severity,
      slaMinutes,
      elapsed: 0,
      source: 'QR Scan',
      status: tech ? 'dispatched' : 'open',
      assignedTech: tech?.name ?? null,
      techId: tech?.id ?? null,
      closureNotes: null as null,
      description: note ? `${description}\n\nReporter note: ${note}` : description,
      activityLog,
      imageUrl: uploadedImageUrl || undefined,
      aiMetadata: aiMeta ? {
        ...aiMeta,
        reporterName,
        reporterRole,
        siteId,
        assetId,
      } : undefined,
    };

    onIncidentCreated(incident);

    setSubmittedIncident({
      id,
      title,
      severity,
      category,
      assignedTech: tech?.name ?? null,
      eta: tech?.eta ?? null,
    });

    setTimeout(() => setStep('success'), 600);
  }, [siteId, assetId, reporterName, reporterRole, uploadedImageUrl, onIncidentCreated]);

  const handleReviewSubmit = useCallback((edited: Partial<AiAnalysis> & { note: string }) => {
    if (!aiAnalysis) return;
    const merged = { ...aiAnalysis, ...edited };
    buildAndSubmit(
      merged.title ?? aiAnalysis.title,
      merged.description ?? aiAnalysis.description,
      merged.severity ?? aiAnalysis.severity,
      aiAnalysis.category,
      edited.note,
      merged as AiAnalysis,
    );
  }, [aiAnalysis, buildAndSubmit]);

  const handleManualSubmit = useCallback((data: { title: string; description: string; severity: string; category: string; note: string }) => {
    buildAndSubmit(data.title, data.description, data.severity, data.category || 'General', data.note);
  }, [buildAndSubmit]);

  const handleTrack = useCallback(() => {
    window.location.href = import.meta.env.BASE_URL ?? '/';
  }, []);

  return (
    <div className="min-h-screen bg-[#0A1628] flex flex-col" style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="bg-[#0D1E3A] border-b border-[rgba(46,127,255,0.2)] px-4 py-3 flex items-center gap-2 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-[#2E7FFF] flex items-center justify-center flex-shrink-0">
          <QrCode size={14} className="text-white" />
        </div>
        <span className="text-[13px] font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          DevelopmentX AI-OS
        </span>
        <span className="text-[11px] text-[#7A94B4] ml-auto">Issue Capture</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex flex-col flex-1"
        >
          {step === 'onboarding' && (
            <OnboardingStep
              siteId={siteId}
              assetId={assetId}
              onContinue={(name, role) => {
                setReporterName(name);
                setReporterRole(role);
                setStep('capture');
              }}
            />
          )}
          {step === 'capture' && (
            <CaptureStep
              onAnalyze={handleAnalyze}
              onBack={() => setStep('onboarding')}
            />
          )}
          {step === 'analyzing' && <AnalyzingStep />}
          {step === 'review' && aiAnalysis && (
            <ReviewStep
              analysis={aiAnalysis}
              imageUrl={uploadedImageUrl}
              onSubmit={handleReviewSubmit}
              onRetake={() => { setAiAnalysis(null); setStep('capture'); }}
            />
          )}
          {step === 'manual' && (
            <ManualFallbackStep
              imageUrl={uploadedImageUrl}
              onSubmit={handleManualSubmit}
              onRetake={() => setStep('capture')}
            />
          )}
          {step === 'submitting' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <Loader2 size={32} className="text-[#2E7FFF]" />
                </motion.div>
                <p className="text-[14px] text-[#7A94B4]">Creating incident record…</p>
              </div>
            </div>
          )}
          {step === 'success' && submittedIncident && (
            <SuccessStep incident={submittedIncident} onTrack={handleTrack} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
