import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, Loader2, Brain, X, ImageIcon } from 'lucide-react';
import type { ToastFn } from '@/lib/ui';
import { submitIncident, analyzeImage, type AiAnalysis } from './incidentUtils';
import { AnalysisResultCard } from './AnalysisResultCard';

interface Props {
  onSuccess: (ref: string) => void;
  onToast: ToastFn;
  clientId?: string;
  siteId?: string;
  demoActionRequest?: { actionId: string; nonce: number } | null;
}

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
const DEMO_WATER_LEAK_IMAGE_URL = `${BASE_URL}/demo/resident-water-leak-wall.webp`;

const DEMO_WATER_LEAK_ANALYSIS: AiAnalysis = {
  title: 'Water Leak Behind Wall',
  description: 'Uploaded photo shows blistering paint, raised plaster, and localised surface breakdown consistent with moisture trapped behind the wall finish. The pattern suggests a concealed pipe or waterproofing leak rather than a simple surface stain.',
  category: 'Plumbing',
  subCategory: 'Water Leak / Damp Wall',
  identifiedAsset: 'Interior Wall / Concealed Pipework',
  observations: [
    'Paint blistering and raised plaster are visible across the lower wall.',
    'Exposed plaster patches indicate prolonged moisture contact.',
    'Damage sits close to skirting level, so hidden pipework or waterproofing should be checked before repainting.',
  ],
  recommendedAction: 'Dispatch a plumbing technician to isolate the source, check concealed pipework with a moisture meter or thermal scan, protect adjacent finishes, and repair the wall only after the leak is fixed and dried.',
  priority: 'high',
  confidence: 92,
};

function compressThumbnail(dataUrl: string, maxWidth = 320, quality = 0.6): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      cv.getContext('2d')?.drawImage(img, 0, 0, w, h);
      resolve(cv.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function UploadMode({ onSuccess, onToast, clientId, siteId, demoActionRequest }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const demoPreviewTimerRef = useRef<number | null>(null);
  const demoAnalysisTimerRef = useRef<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onToast('Please upload an image file', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      setAnalysing(true);
      const result = await analyzeImage(dataUrl);
      setAnalysis(result);
      setAnalysing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const runDemoWaterLeakUpload = useCallback(() => {
    if (demoPreviewTimerRef.current) window.clearTimeout(demoPreviewTimerRef.current);
    if (demoAnalysisTimerRef.current) window.clearTimeout(demoAnalysisTimerRef.current);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setDragging(false);
    setPreview(null);
    setAnalysis(null);
    setAnalysing(true);
    setSubmitting(false);
    demoPreviewTimerRef.current = window.setTimeout(() => {
      setPreview(DEMO_WATER_LEAK_IMAGE_URL);
    }, 1400);
    demoAnalysisTimerRef.current = window.setTimeout(() => {
      setAnalysis(DEMO_WATER_LEAK_ANALYSIS);
      setAnalysing(false);
      onToast('AI analysed uploaded water leak photo', 'info');
    }, 3600);
  }, [onToast]);

  const runDemoSubmitReport = useCallback(() => {
    if (!preview || !analysis || submitting) return;
    setSubmitting(true);
    window.setTimeout(() => {
      onToast('Incident INC-H-DEMO submitted - our team is on it', 'success');
      onSuccess('INC-H-DEMO');
    }, 650);
  }, [analysis, onSuccess, onToast, preview, submitting]);

  useEffect(() => {
    if (demoActionRequest?.actionId !== 'resident-mode-upload') return;
    runDemoWaterLeakUpload();
  }, [demoActionRequest?.actionId, demoActionRequest?.nonce, runDemoWaterLeakUpload]);

  useEffect(() => {
    if (demoActionRequest?.actionId !== 'resident-submit-report') return;
    runDemoSubmitReport();
  }, [demoActionRequest?.actionId, demoActionRequest?.nonce, runDemoSubmitReport]);

  useEffect(() => () => {
    if (demoPreviewTimerRef.current) window.clearTimeout(demoPreviewTimerRef.current);
    if (demoAnalysisTimerRef.current) window.clearTimeout(demoAnalysisTimerRef.current);
  }, []);

  const clearPhoto = () => {
    if (demoPreviewTimerRef.current) window.clearTimeout(demoPreviewTimerRef.current);
    if (demoAnalysisTimerRef.current) window.clearTimeout(demoAnalysisTimerRef.current);
    setPreview(null);
    setAnalysis(null);
    setAnalysing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const imageUrl = preview ? await compressThumbnail(preview) : undefined;
      const ref = await submitIncident({ source: 'Resident App', analysis, imageUrl, clientId, siteId });
      onToast(`Incident ${ref} submitted — our team is on it`, 'success');
      onSuccess(ref);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit. Please try again.';
      onToast(msg, 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFAF5] p-4 space-y-4 overflow-y-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {!preview ? (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          data-demo-anchor="resident-upload-dropzone"
          className={`w-full border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 transition-all duration-200 ${
            dragging
              ? 'border-[#7C3AED] bg-[rgba(124,58,237,0.05)]'
              : 'border-[#D8C8A0] bg-white hover:border-[#7C3AED] hover:bg-[rgba(124,58,237,0.02)]'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-[rgba(124,58,237,0.1)] flex items-center justify-center">
            <Upload size={28} className="text-[#7C3AED]" />
          </div>
          <div className="text-center">
            <div className="font-semibold text-[#2C1810] text-sm">Tap to choose a photo</div>
            <div className="text-[11px] text-[#8B7355] mt-1">or drag and drop an image here</div>
          </div>
          <div className="text-[10px] text-[#A89070] bg-[#F5EFE0] px-3 py-1.5 rounded-full">
            JPG, PNG, HEIC · Max 20 MB
          </div>
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          data-demo-anchor="resident-upload-preview"
          className="relative rounded-2xl overflow-hidden border border-[#E8DEC8]"
        >
          <img src={preview} alt="upload preview" className="w-full object-cover max-h-56" />
          <button
            onClick={clearPhoto}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white"
          >
            <X size={14} />
          </button>
          {!analysis && !analysing && (
            <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg px-2 py-1 flex items-center gap-1">
              <ImageIcon size={12} className="text-[#7C3AED]" />
              <span className="text-[11px] text-[#5C4A2A] font-medium">Photo ready</span>
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {analysing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            data-demo-anchor="resident-ai-photo-analysis"
            className="flex items-center gap-3 p-3 rounded-xl bg-[#F0FDF4] border border-emerald-200"
          >
            <Brain size={16} className="text-emerald-600 animate-pulse flex-shrink-0" />
            <div>
              <div className="text-[12px] font-semibold text-emerald-800">
                {preview ? 'AI is analysing your photo...' : 'AI is analysing the incident...'}
              </div>
              <div className="text-[10px] text-emerald-600">
                {preview ? 'Identifying the issue, observations and priority' : 'Preparing the evidence upload and checking urgency'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {analysis && !analysing && (
          <div data-demo-anchor="resident-ai-analysis-result">
            <AnalysisResultCard analysis={analysis} />
          </div>
        )}
      </AnimatePresence>

      {preview && (
        <button
          onClick={handleSubmit}
          disabled={submitting || analysing}
          data-demo-action="resident-submit-report"
          data-demo-anchor="resident-service-submit-report"
          className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #1C3A35 0%, #2D5A50 100%)' }}
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>
      )}
    </div>
  );
}
