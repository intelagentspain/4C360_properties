import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Play, Pause, CheckCircle, Loader2 } from 'lucide-react';
import type { ToastFn } from '@/lib/ui';
import { submitIncident } from './incidentUtils';

interface Props {
  onSuccess: (ref: string) => void;
  onToast: ToastFn;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VoiceMode({ onSuccess, onToast }: Props) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [description, setDescription] = useState('Voice note recorded — our team will listen and respond');
  const [submitting, setSubmitting] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(Array(20).fill(8));
  const [micError, setMicError] = useState<string | null>(null);

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
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
        audioCtx.close();
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
      setMicError('Microphone access denied. Please allow microphone access or use another reporting method.');
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

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const ref = await submitIncident({ source: 'voice', description });
      if (audioBlob && audioBlob.size > 0) {
        try {
          const form = new FormData();
          form.append('audio', audioBlob, `voice-note-${ref}.webm`);
          form.append('incidentId', ref);
          form.append('transcription', description || 'Voice note recorded — our team will listen and respond');
          const voiceResp = await fetch(`${import.meta.env.BASE_URL?.replace(/\/$/, '') ?? ''}/api/incidents/${ref}/voice-note`, {
            method: 'POST',
            body: form,
          });
          if (!voiceResp.ok) {
            onToast('Incident submitted — voice note could not be attached', 'warning');
          }
        } catch {
          onToast('Incident submitted — voice note could not be attached', 'warning');
        }
      }
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
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
          <Mic size={28} className="text-amber-600" />
        </div>
        <p className="text-[#5C4A2A] text-sm leading-relaxed">{micError}</p>
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
            <div className="text-[11px] text-[#8B7355]">{formatTime(elapsed)} · ready to submit</div>
            <button
              onClick={togglePlayback}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E8DEC8] text-[#5C4A2A] text-[12px] font-medium hover:bg-[#F5EFE0] transition-colors"
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
              {playing ? 'Pause playback' : 'Play back recording'}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {audioUrl && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <label className="text-[11px] font-medium text-[#8B7355] uppercase tracking-widest">
              Description (editable)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl border border-[#E8DEC8] bg-white text-[#2C1810] text-[12px] resize-none focus:outline-none focus:border-[#1C3A35] transition-colors placeholder-[#A89070]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {audioUrl && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #1C3A35 0%, #2D5A50 100%)' }}
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          {submitting ? 'Submitting…' : 'Submit Voice Note'}
        </button>
      )}
    </div>
  );
}
