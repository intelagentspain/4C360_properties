import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wind, Zap, Droplets, ArrowUpDown, Sparkles, Shield, HelpCircle,
  ArrowRight, ArrowLeft, CheckCircle, RefreshCw, Camera, Upload,
  MapPin, AlertTriangle, Loader2, Clock, X,
} from 'lucide-react';
import { submitIncident, analyzeImage, type AiAnalysis } from '@/components/client/hospitality/incidentUtils';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

const CATEGORIES = [
  { id: 'ac',        label: 'AC / Cooling',    icon: Wind,        color: '#4A7FA5', bg: 'rgba(74,127,165,0.10)',  border: 'rgba(74,127,165,0.25)' },
  { id: 'electrical',label: 'Electrical',       icon: Zap,         color: '#B8913A', bg: 'rgba(184,145,58,0.10)',  border: 'rgba(184,145,58,0.25)' },
  { id: 'plumbing',  label: 'Plumbing',         icon: Droplets,    color: '#2D4A6E', bg: 'rgba(45,74,110,0.10)',   border: 'rgba(45,74,110,0.25)' },
  { id: 'lift',      label: 'Lift / Elevator',  icon: ArrowUpDown, color: '#6B5EA8', bg: 'rgba(107,94,168,0.10)',  border: 'rgba(107,94,168,0.25)' },
  { id: 'cleaning',  label: 'Cleaning',         icon: Sparkles,    color: '#3A8A6E', bg: 'rgba(58,138,110,0.10)',  border: 'rgba(58,138,110,0.25)' },
  { id: 'security',  label: 'Security',         icon: Shield,      color: '#C0392B', bg: 'rgba(192,57,43,0.10)',   border: 'rgba(192,57,43,0.25)' },
  { id: 'other',     label: 'Other',            icon: HelpCircle,  color: '#7A6A55', bg: 'rgba(122,106,85,0.10)',  border: 'rgba(122,106,85,0.25)' },
];

const URGENCY_OPTIONS = [
  { id: 'routine',   label: 'Routine',   desc: 'Non-urgent, schedule when convenient', color: '#3A8A6E', bg: 'rgba(58,138,110,0.10)', border: 'rgba(58,138,110,0.25)' },
  { id: 'urgent',    label: 'Urgent',    desc: 'Needs attention soon (within 2 hours)', color: '#B8913A', bg: 'rgba(184,145,58,0.10)', border: 'rgba(184,145,58,0.25)' },
  { id: 'emergency', label: 'Emergency', desc: 'Immediate danger or service loss',       color: '#C0392B', bg: 'rgba(192,57,43,0.10)', border: 'rgba(192,57,43,0.25)' },
];

interface StepBarProps {
  step: number;
  total: number;
}
function StepBar({ step, total }: StepBarProps) {
  return (
    <div className="flex items-center gap-1.5 px-6 py-3">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1 rounded-full flex-1 transition-all duration-500"
          style={{
            background: i < step ? '#C9A96E' : i === step ? 'rgba(201,169,110,0.4)' : 'rgba(255,255,255,0.12)',
          }}
        />
      ))}
      <span className="text-[10px] font-medium ml-1 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {step + 1} / {total}
      </span>
    </div>
  );
}

interface ReportPageProps {
  memberToken?: string;
}

export function ReportPage({ memberToken }: ReportPageProps) {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [location, setLocation] = useState(memberToken ? 'Dubai Silicon Oasis' : '');
  const [urgency, setUrgency] = useState<string>('routine');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [incidentRef, setIncidentRef] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const selectedCat = CATEGORIES.find(c => c.id === category);
  const selectedUrgency = URGENCY_OPTIONS.find(u => u.id === urgency);

  async function handlePhotoSelect(file: File) {
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    setAnalyzing(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const analysis = await analyzeImage(dataUrl);
      setAiAnalysis(analysis);
      const matched = CATEGORIES.find(c =>
        c.id === 'ac' && analysis.category.toLowerCase().includes('hvac') ||
        c.id === analysis.category.toLowerCase().split(' ')[0]
      );
      if (matched && !category) setCategory(matched.id);
    } catch {
      setAiAnalysis(null);
    } finally {
      setAnalyzing(false);
    }
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function handleRemovePhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setAiAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const selectedCatLabel = CATEGORIES.find(c => c.id === category)?.label ?? category;
      const locationSuffix = `Location: ${location}. Urgency: ${urgency}.`;
      const fullDescription = description
        ? `${description}\n${locationSuffix}`
        : `${selectedCatLabel} issue reported. ${locationSuffix}`;
      const ref = await submitIncident({
        source: 'upload',
        analysis: aiAnalysis ?? {
          title: `${selectedCatLabel} Issue`,
          description: fullDescription,
          category: selectedCatLabel,
          subCategory: urgency,
          identifiedAsset: 'Property Area',
          observations: [`Reported by resident: ${selectedCatLabel}`],
          recommendedAction: 'Dispatch maintenance team to inspect and assess.',
          priority: urgency === 'emergency' ? 'high' : urgency === 'urgent' ? 'medium' : 'low',
          confidence: 80,
        },
        description: fullDescription,
      });
      setIncidentRef(ref);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep(0);
    setCategory('');
    setDescription('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setAiAnalysis(null);
    setLocation(memberToken ? 'Dubai Silicon Oasis' : '');
    setUrgency('routine');
    setSubmitted(false);
    setIncidentRef('');
    setError(null);
  }

  if (submitted) {
    return <SuccessView incidentRef={incidentRef} onAnother={reset} />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FDFAF6' }}>
      <div
        className="flex-shrink-0"
        style={{ background: 'linear-gradient(150deg, #1A2942 0%, #243555 60%, #2D4A6E 100%)' }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(201,169,110,0.2)', border: '1px solid rgba(201,169,110,0.3)' }}
            >
              <AlertTriangle size={15} style={{ color: '#C9A96E' }} />
            </div>
            <div>
              <div className="font-bold text-white text-sm" style={{ fontFamily: 'Georgia, serif' }}>
                Imdaad
              </div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Facility Management
              </div>
            </div>
          </div>
          <div className="text-[11px] font-semibold" style={{ color: '#C9A96E' }}>
            Report an Incident
          </div>
        </div>
        <StepBar step={step} total={4} />
      </div>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex-1 flex flex-col px-5 py-6"
            >
              <h2 className="text-xl font-bold mb-1" style={{ color: '#1A2942', fontFamily: 'Georgia, serif' }}>
                What happened?
              </h2>
              <p className="text-sm mb-6" style={{ color: '#8B7D68' }}>
                Select the category that best describes the issue.
              </p>

              <div className="grid grid-cols-2 gap-3 flex-1">
                {CATEGORIES.map((cat, i) => {
                  const Icon = cat.icon;
                  return (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.22 }}
                      onClick={() => setCategory(cat.id)}
                      className="flex flex-col items-start p-4 rounded-2xl text-left transition-all duration-200 active:scale-[0.97]"
                      style={{
                        background: category === cat.id ? cat.bg : '#FFFFFF',
                        border: `2px solid ${category === cat.id ? cat.color : cat.border}`,
                        boxShadow: category === cat.id ? `0 4px 16px ${cat.bg}` : '0 1px 4px rgba(26,41,66,0.06)',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                        style={{ background: cat.bg }}
                      >
                        <Icon size={20} style={{ color: cat.color }} />
                      </div>
                      <div className="font-semibold text-[13px]" style={{ color: '#1A2942' }}>
                        {cat.label}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <button
                disabled={!category}
                onClick={() => setStep(1)}
                className="mt-6 w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: category ? '#1A2942' : '#E8DEC8',
                  color: category ? '#ffffff' : '#A09080',
                  cursor: category ? 'pointer' : 'not-allowed',
                }}
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex-1 flex flex-col px-5 py-6"
            >
              <button
                onClick={() => setStep(0)}
                className="flex items-center gap-1.5 mb-4 text-sm"
                style={{ color: '#8B7D68' }}
              >
                <ArrowLeft size={15} />
                Back
              </button>

              <h2 className="text-xl font-bold mb-1" style={{ color: '#1A2942', fontFamily: 'Georgia, serif' }}>
                Describe it
              </h2>
              <p className="text-sm mb-5" style={{ color: '#8B7D68' }}>
                Tell us what you're experiencing and optionally add a photo.
              </p>

              {selectedCat && (
                <div
                  className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl"
                  style={{ background: selectedCat.bg, border: `1px solid ${selectedCat.border}` }}
                >
                  <selectedCat.icon size={14} style={{ color: selectedCat.color }} />
                  <span className="text-[12px] font-semibold" style={{ color: selectedCat.color }}>
                    {selectedCat.label}
                  </span>
                </div>
              )}

              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the issue briefly… e.g. The AC in the living room stopped working this morning."
                rows={4}
                className="w-full rounded-2xl px-4 py-3 text-sm resize-none outline-none transition-all duration-200 mb-4"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #EDE5D4',
                  color: '#1A2942',
                }}
                onFocus={e => { e.currentTarget.style.border = '1px solid #C9A96E'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid #EDE5D4'; }}
              />

              <div className="mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#A09080' }}>
                  Photo (optional)
                </p>

                {!photoPreview ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.97]"
                      style={{ background: '#FFFFFF', border: '1px solid #EDE5D4', color: '#1A2942' }}
                    >
                      <Camera size={16} style={{ color: '#4A7FA5' }} />
                      Camera
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.97]"
                      style={{ background: '#FFFFFF', border: '1px solid #EDE5D4', color: '#1A2942' }}
                    >
                      <Upload size={16} style={{ color: '#7A6A55' }} />
                      Upload
                    </button>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid #EDE5D4' }}>
                    <img src={photoPreview} alt="Incident" className="w-full object-cover max-h-48" />
                    <button
                      onClick={handleRemovePhoto}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(26,41,66,0.7)' }}
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                )}

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f); }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f); }}
                />

                <AnimatePresence>
                  {analyzing && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                      style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)' }}
                    >
                      <Loader2 size={14} style={{ color: '#C9A96E' }} className="animate-spin" />
                      <span className="text-[12px]" style={{ color: '#7A6A55' }}>
                        AI is classifying your photo…
                      </span>
                    </motion.div>
                  )}
                  {aiAnalysis && !analyzing && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="mt-3 px-3 py-3 rounded-xl"
                      style={{ background: 'rgba(58,138,110,0.08)', border: '1px solid rgba(58,138,110,0.2)' }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle size={12} style={{ color: '#3A8A6E' }} />
                        <span className="text-[11px] font-semibold" style={{ color: '#3A8A6E' }}>
                          AI Classification — {aiAnalysis.confidence}% confidence
                        </span>
                      </div>
                      <div className="text-[12px]" style={{ color: '#5C4A2A' }}>
                        <span className="font-semibold">{aiAnalysis.category}</span>
                        {aiAnalysis.subCategory && ` · ${aiAnalysis.subCategory}`}
                        {' · '}
                        <span style={{ color: aiAnalysis.priority === 'high' ? '#C0392B' : aiAnalysis.priority === 'medium' ? '#B8913A' : '#3A8A6E' }}>
                          {aiAnalysis.priority.charAt(0).toUpperCase() + aiAnalysis.priority.slice(1)} urgency
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setStep(2)}
                className="mt-auto w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                style={{ background: '#1A2942', color: '#ffffff' }}
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex-1 flex flex-col px-5 py-6"
            >
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 mb-4 text-sm"
                style={{ color: '#8B7D68' }}
              >
                <ArrowLeft size={15} />
                Back
              </button>

              <h2 className="text-xl font-bold mb-1" style={{ color: '#1A2942', fontFamily: 'Georgia, serif' }}>
                Where &amp; when?
              </h2>
              <p className="text-sm mb-5" style={{ color: '#8B7D68' }}>
                Help our team find you quickly.
              </p>

              <div className="mb-5">
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#A09080' }}>
                  Location
                </p>
                <div className="flex items-center gap-2 rounded-2xl px-4 py-3" style={{ background: '#FFFFFF', border: '1px solid #EDE5D4' }}>
                  <MapPin size={16} style={{ color: '#C9A96E' }} />
                  <input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Building A, Floor 3, Flat 302"
                    className="flex-1 outline-none text-sm"
                    style={{ background: 'transparent', color: '#1A2942' }}
                  />
                </div>
              </div>

              <div className="mb-6">
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#A09080' }}>
                  Urgency Level
                </p>
                <div className="space-y-2">
                  {URGENCY_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setUrgency(opt.id)}
                      className="w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-all duration-200"
                      style={{
                        background: urgency === opt.id ? opt.bg : '#FFFFFF',
                        border: `2px solid ${urgency === opt.id ? opt.color : '#EDE5D4'}`,
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                        style={{
                          background: urgency === opt.id ? opt.color : 'transparent',
                          border: `2px solid ${urgency === opt.id ? opt.color : '#C9A96E'}`,
                        }}
                      >
                        {urgency === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: '#1A2942' }}>{opt.label}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: '#8B7D68' }}>{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={!location}
                onClick={() => setStep(3)}
                className="mt-auto w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: location ? '#1A2942' : '#E8DEC8',
                  color: location ? '#ffffff' : '#A09080',
                  cursor: location ? 'pointer' : 'not-allowed',
                }}
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex-1 flex flex-col px-5 py-6"
            >
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 mb-4 text-sm"
                style={{ color: '#8B7D68' }}
              >
                <ArrowLeft size={15} />
                Back
              </button>

              <h2 className="text-xl font-bold mb-1" style={{ color: '#1A2942', fontFamily: 'Georgia, serif' }}>
                Review &amp; submit
              </h2>
              <p className="text-sm mb-5" style={{ color: '#8B7D68' }}>
                Please review your report before submitting.
              </p>

              <div className="space-y-3 mb-6">
                <SummaryCard label="Category" value={selectedCat?.label ?? category}>
                  {selectedCat && <selectedCat.icon size={13} style={{ color: selectedCat.color }} />}
                </SummaryCard>

                {description && (
                  <SummaryCard label="Description" value={description} />
                )}

                {photoPreview && (
                  <div className="rounded-2xl overflow-hidden p-4" style={{ background: '#FFFFFF', border: '1px solid #EDE5D4' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#A09080' }}>Photo</p>
                    <img src={photoPreview} alt="Incident" className="w-full rounded-xl object-cover max-h-32" />
                    {aiAnalysis && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <CheckCircle size={11} style={{ color: '#3A8A6E' }} />
                        <span className="text-[11px]" style={{ color: '#3A8A6E' }}>
                          AI: {aiAnalysis.category} · {aiAnalysis.confidence}% confidence
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <SummaryCard label="Location" value={location}>
                  <MapPin size={13} style={{ color: '#C9A96E' }} />
                </SummaryCard>

                <SummaryCard
                  label="Urgency"
                  value={selectedUrgency?.label ?? urgency}
                  valueStyle={{ color: selectedUrgency?.color }}
                />
              </div>

              {error && (
                <div
                  className="mb-4 px-4 py-3 rounded-2xl text-sm"
                  style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', color: '#C0392B' }}
                >
                  {error}
                </div>
              )}

              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                style={{ background: '#1A2942', color: '#ffffff', opacity: submitting ? 0.8 : 1 }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    Submit Report
                    <CheckCircle size={16} />
                  </>
                )}
              </button>

              <p className="text-center text-[11px] mt-3" style={{ color: '#A09080' }}>
                Our team responds within 30 minutes of submission.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  children,
  valueStyle,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid #EDE5D4' }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#A09080' }}>{label}</p>
      <div className="flex items-center gap-1.5">
        {children}
        <p className="text-sm font-medium" style={{ color: '#1A2942', ...valueStyle }}>{value}</p>
      </div>
    </div>
  );
}

function SuccessView({ incidentRef, onAnother }: { incidentRef: string; onAnother: () => void }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FDFAF6' }}>
      <div
        className="flex-shrink-0 px-5 pt-5 pb-10 flex flex-col items-center text-center"
        style={{ background: 'linear-gradient(150deg, #1A2942 0%, #243555 60%, #2D4A6E 100%)' }}
      >
        <div className="flex items-center gap-2.5 self-start mb-8">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(201,169,110,0.2)', border: '1px solid rgba(201,169,110,0.3)' }}
          >
            <AlertTriangle size={15} style={{ color: '#C9A96E' }} />
          </div>
          <div>
            <div className="font-bold text-white text-sm" style={{ fontFamily: 'Georgia, serif' }}>Imdaad</div>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Facility Management</div>
          </div>
        </div>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
          style={{ background: 'rgba(58,138,110,0.2)', border: '2px solid rgba(58,138,110,0.4)' }}
        >
          <CheckCircle size={40} className="text-white" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-white mb-2"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          We're on it!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          Your incident report has been submitted successfully.
        </motion.p>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-5 py-6 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-4"
          style={{ background: '#FFFFFF', border: '1px solid #EDE5D4', boxShadow: '0 2px 8px rgba(26,41,66,0.08)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#A09080' }}>
            Reference Number
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold" style={{ fontFamily: 'monospace', color: '#1A2942' }}>
              {incidentRef}
            </span>
            <span
              className="text-[11px] font-semibold px-3 py-1 rounded-full"
              style={{ background: 'rgba(58,138,110,0.1)', color: '#3A8A6E', border: '1px solid rgba(58,138,110,0.2)' }}
            >
              Submitted
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-4"
          style={{ background: '#FFFFFF', border: '1px solid #EDE5D4', boxShadow: '0 2px 8px rgba(26,41,66,0.08)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} style={{ color: '#C9A96E' }} />
            <span className="text-sm font-semibold" style={{ color: '#1A2942' }}>Expected Response</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#F5EFE0' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '30%' }}
                transition={{ delay: 0.8, duration: 1 }}
                className="h-full rounded-full"
                style={{ background: '#C9A96E' }}
              />
            </div>
            <span className="text-[11px] flex-shrink-0" style={{ color: '#8B7D68' }}>En route</span>
          </div>
          <p className="text-[13px]" style={{ color: '#5C4A2A' }}>
            Our team will respond within{' '}
            <span className="font-bold" style={{ color: '#1A2942' }}>30 minutes</span>.
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          onClick={onAnother}
          className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
          style={{ background: '#FFFFFF', border: '1px solid #EDE5D4', color: '#5C4A2A' }}
        >
          <RefreshCw size={15} />
          Submit Another Report
        </motion.button>

        <motion.a
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          href={`${BASE}/`}
          className="block w-full py-3 rounded-2xl font-semibold text-sm text-center transition-all duration-200 active:scale-[0.98]"
          style={{ color: '#A09080' }}
        >
          ← Go back
        </motion.a>
      </div>
    </div>
  );
}
