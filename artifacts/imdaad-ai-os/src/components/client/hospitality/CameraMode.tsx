import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RefreshCw, CheckCircle, Loader2, Brain, AlertCircle } from 'lucide-react';
import type { ToastFn } from '@/lib/ui';
import { submitIncident, analyzeImage, type AiAnalysis } from './incidentUtils';

interface Props {
  onSuccess: (ref: string) => void;
  onToast: ToastFn;
}

export function CameraMode({ onSuccess, onToast }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch {
      setCameraError('Camera access denied. Please allow camera access in your browser settings, or use another reporting method.');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhoto(dataUrl);
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);

    setAnalysing(true);
    const result = await analyzeImage(dataUrl);
    setAnalysis(result);
    setAnalysing(false);
  };

  const retake = async () => {
    setPhoto(null);
    setAnalysis(null);
    setAnalysing(false);
    await startCamera();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const ref = await submitIncident({ source: 'camera', analysis });
      onToast(`Incident ${ref} submitted — our team is on it`, 'success');
      onSuccess(ref);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit. Please try again.';
      onToast(msg, 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFAF5]">
      {cameraError ? (
        <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertCircle size={28} className="text-amber-600" />
          </div>
          <p className="text-[#5C4A2A] text-sm leading-relaxed">{cameraError}</p>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex-1 relative overflow-hidden bg-black">
            {!photo && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
            {photo && (
              <img src={photo} alt="captured" className="w-full h-full object-cover" />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex-shrink-0 p-4 bg-white border-t border-[#E8DEC8] space-y-3">
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
                    <div className="text-[10px] text-emerald-600">Checking issue type and priority</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {analysis && !analysing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-[#F5EFE0] border border-[#E8DEC8] space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-[#0D9488]" />
                    <span className="text-[12px] font-semibold text-[#2C1810]">AI Analysis</span>
                    <span className="ml-auto text-[10px] bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/30 px-2 py-0.5 rounded-full font-semibold">
                      {analysis.confidence}% confident
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#8B7355]">Issue type</span>
                    <span className="text-[#2C1810] font-semibold">{analysis.category}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#8B7355]">Priority</span>
                    <span className={`font-semibold ${analysis.priority === 'high' ? 'text-red-600' : analysis.priority === 'medium' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {analysis.priority.charAt(0).toUpperCase() + analysis.priority.slice(1)}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8B7355] pt-1 border-t border-[#E8DEC8]">{analysis.summary}</div>
                </motion.div>
              )}
            </AnimatePresence>

            {!photo ? (
              <button
                onClick={capturePhoto}
                className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1C3A35 0%, #2D5A50 100%)' }}
              >
                <Camera size={18} /> Take Photo
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={retake}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-2xl font-semibold text-[#5C4A2A] text-sm border border-[#E8DEC8] bg-white flex items-center justify-center gap-2"
                >
                  <RefreshCw size={15} /> Retake
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || analysing}
                  className="flex-[2] py-3 rounded-2xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #1C3A35 0%, #2D5A50 100%)' }}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {submitting ? 'Submitting…' : 'Submit Report'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
