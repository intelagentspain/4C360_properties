import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Play, Pause, CheckCircle, Loader2, Brain } from 'lucide-react';
import type { ToastFn } from '@/lib/ui';
import { submitIncident, transcribeAndAnalyzeVoice, type AiAnalysis } from './incidentUtils';
import { AnalysisResultCard } from './AnalysisResultCard';

interface Props {
  onSuccess: (ref: string) => void;
  onToast: ToastFn;
  clientId?: string;
  siteId?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VoiceMode({ onSuccess, onToast, clientId, siteId }: Props) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [transcript, setTranscript] = useState('');
  const [analyseFailed, setAnalyseFailed] = useState(false);
  const [fallbackText, setFallbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(Array(20).fill(8));
  const [micError, setMicError] = useState<string | null>(null);
  const [manualDescription, setManualDescription] = useState('');

  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      animFrameRef.current && cancelAnimationFrame(animFrameRef.current);
      mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      setMicError(null);
      setAnalysis(null);
      setTranscript('');
      setAnalyseFailed(false);
      setFallbackText('');
      setAudioUrl(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
        audioCtx.close();

        setAnalysing(true);
        const result = await transcribeAndAnalyzeVoice(blob);
        setAnalysis(result.analysis);
        setTranscript(result.transcript);
        setAnalyseFailed(result.failed);
        if (result.failed) {
          setFallbackText(result.transcript || '');
        }
        setAnalysing(false);
      };
      mr.start();
      mediaRecorderRef.current = mr;

      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);

      const tick = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const bars = Array.from({ length: 20 }, (_, i) => {
          const val = data[Math.floor(i * data.length / 20)] / 255;
          return Math.max(4, Math.round(val * 48));
        });
        setWaveform(bars);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setMicError('Microphone access denied.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    timerRef.current && clearInterval(timerRef.current);
    animFrameRef.current && cancelAnimationFrame(animFrameRef.current);
    setWaveform(Array(20).fill(8));
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleSubmit = async (descOverride?: string) => {
    setSubmitting(true);
    try {
      const ref = await submitIncident({
        source: 'voice',
        analysis: analysis ?? undefined,
        description: descOverride,
        clientId,
        siteId,
      });
      onToast(`Incident ${ref} submitted — our team is on it`, 'success');
      onSuccess(ref);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit. Please try again.';
      onToast(msg, 'error');
      setSubmitting(false);
    }
  };

  if (micError) {
    return (
      <div className="flex flex-col h-full bg-[#FDFAF5] p-4 space-y-4 overflow-y-auto">
        <div className="flex flex-col items-center py-5 bg-white rounded-2xl border border-[#E8DEC8] gap-3 px-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <Mic size={22} className="text-amber-600" />
          </div>
          <p className="text-[#5C4A2A] text-[12px] leading-relaxed text-center">{micError}</p>
          <p className="text-[11px] text-[#8B7355] text-center">Please describe your issue in writing instead.</p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-medium text-[#8B7355] uppercase tracking-widest">
            Describe the issue
          </label>
          <textarea
            value={manualDescription}
            onChange={e => setManualDescription(e.target.value)}
            rows={4}
            placeholder="e.g. My air conditioning is not working — the unit turns on but doesn't produce cool air."
            className="w-full p-3 rounded-xl border border-[#E8DEC8] bg-white text-[#2C1810] text-[12px] resize-none focus:outline-none focus:border-[#1C3A35] transition-colors placeholder-[#A89070]"
          />
        </div>

        <button
          onClick={() => handleSubmit(manualDescription || undefined)}
          disabled={submitting || !manualDescription.trim()}
          className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #1C3A35 0%, #2D5A50 100%)' }}
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          {submitting ? 'Submitting…' : 'Submit Incident Report'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FDFAF5] p-4 space-y-4 overflow-y-auto">
      <div className="flex flex-col items-center py-6 bg-white rounded-2xl border border-[#E8DEC8]">
        {!audioUrl ? (
          <>
            <div className="relative mb-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={recording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
                  recording
                    ? 'bg-red-500 shadow-lg shadow-red-200'
                    : 'bg-[#1C3A35] shadow-lg shadow-[#1C3A35]/30'
                }`}
              >
                {recording ? <Square size={28} className="text-white" /> : <Mic size={28} className="text-white" />}
              </motion.button>

              {recording && (
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 rounded-full bg-red-400"
                  style={{ zIndex: -1 }}
                />
              )}
            </div>

            {recording && (
              <div className="flex items-end gap-0.5 h-12 mb-3">
                {waveform.map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: h }}
                    transition={{ duration: 0.1 }}
                    className="w-1.5 rounded-full bg-red-400"
                    style={{ height: h }}
                  />
                ))}
              </div>
            )}

            {recording && (
              <div className="text-red-500 font-mono text-lg font-bold mb-1">{formatTime(elapsed)}</div>
            )}

            <div className="text-[12px] text-[#8B7355]">
              {recording ? 'Tap the button to stop recording' : 'Tap the microphone to start recording'}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full px-4">
            <div className="w-14 h-14 rounded-full bg-[#E8F5E9] flex items-center justify-center">
              <CheckCircle size={28} className="text-emerald-600" />
            </div>
            <div className="text-[13px] font-semibold text-[#2C1810]">Voice note recorded</div>
            <div className="text-[11px] text-[#8B7355]">
              {formatTime(elapsed)} · {analysing ? 'transcribing…' : 'ready to submit'}
            </div>
            {!analysing && (
              <button
                onClick={togglePlayback}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E8DEC8] text-[#5C4A2A] text-[12px] font-medium hover:bg-[#F5EFE0] transition-colors"
              >
                {playing ? <Pause size={14} /> : <Play size={14} />}
                {playing ? 'Pause playback' : 'Play back recording'}
              </button>
            )}
          </div>
        )}
      </div>

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
              <div className="text-[12px] font-semibold text-emerald-800">Transcribing and analysing your voice note…</div>
              <div className="text-[10px] text-emerald-600">Converting speech to an FM incident ticket</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {analysis && !analysing && !analyseFailed && (
          <AnalysisResultCard analysis={analysis} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {analysis && !analysing && !analyseFailed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1.5"
          >
            <label className="text-[10px] font-medium text-[#8B7355] uppercase tracking-widest">
              What you said
            </label>
            <textarea
              readOnly
              value={transcript}
              rows={2}
              className="w-full p-3 rounded-xl border border-[#E8DEC8] bg-[#FAFAF7] text-[#2C1810] text-[12px] leading-relaxed resize-none focus:outline-none"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {audioUrl && !analysing && analyseFailed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <label className="text-[11px] font-medium text-[#8B7355] uppercase tracking-widest">
              Describe the issue
            </label>
            <textarea
              value={fallbackText}
              onChange={e => setFallbackText(e.target.value)}
              rows={3}
              placeholder="e.g. My air conditioning is not working, the unit turns on but doesn't produce cool air."
              className="w-full p-3 rounded-xl border border-[#E8DEC8] bg-white text-[#2C1810] text-[12px] resize-none focus:outline-none focus:border-[#1C3A35] transition-colors placeholder-[#A89070]"
            />
            <p className="text-[10px] text-[#A89070]">AI transcription was unavailable. Please describe the issue above.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {audioUrl && !analysing && (
        <button
          onClick={() => {
            if (analyseFailed) {
              handleSubmit(fallbackText || undefined);
            } else {
              handleSubmit();
            }
          }}
          disabled={submitting || (analyseFailed && !fallbackText.trim())}
          className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #1C3A35 0%, #2D5A50 100%)' }}
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          {submitting ? 'Submitting…' : 'Submit Incident Report'}
        </button>
      )}
    </div>
  );
}
