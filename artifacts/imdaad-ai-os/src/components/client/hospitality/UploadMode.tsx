import { useState, useRef, useCallback } from 'react';
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
}

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

export function UploadMode({ onSuccess, onToast, clientId, siteId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const clearPhoto = () => {
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
            className="flex items-center gap-3 p-3 rounded-xl bg-[#F0FDF4] border border-emerald-200"
          >
            <Brain size={16} className="text-emerald-600 animate-pulse flex-shrink-0" />
            <div>
              <div className="text-[12px] font-semibold text-emerald-800">AI is analysing your photo…</div>
              <div className="text-[10px] text-emerald-600">Identifying the issue, observations and priority</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {analysis && !analysing && (
          <AnalysisResultCard analysis={analysis} />
        )}
      </AnimatePresence>

      {preview && (
        <button
          onClick={handleSubmit}
          disabled={submitting || analysing}
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
