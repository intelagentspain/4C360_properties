import { useMemo, useState } from 'react';
import { Camera, CheckCircle2, FileSignature, MapPin, Mic, QrCode, ShieldAlert } from 'lucide-react';
import { surveys } from './data';

export function FieldOpsCapture({ surveyId }: { surveyId: string }) {
  const survey = useMemo(() => surveys.find(item => item.id === surveyId) ?? surveys[0], [surveyId]);
  const [answered, setAnswered] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [blocked, setBlocked] = useState('');

  const required = survey.questions.filter(question => question.required);
  const completeCount = required.filter(question => answered[question.id]).length;
  const progress = required.length ? Math.round((completeCount / required.length) * 100) : 100;

  const submit = () => {
    if (progress < 100) {
      setBlocked('Complete all mandatory questions and required evidence before submitting.');
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111F] p-4 text-[#EEF3FA]">
        <div className="w-full max-w-sm rounded-[2rem] border border-emerald-400/25 bg-[#0A1628] p-6 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
            <CheckCircle2 size={34} />
          </div>
          <h1 className="mt-5 text-2xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Submitted</h1>
          <p className="mt-2 text-sm leading-6 text-[#B8C7DB]">Your survey has been submitted and is pending supervisor review.</p>
          <div className="mt-5 rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Submission ID</p>
            <p className="mt-1 font-mono text-sm font-bold text-[#EEF3FA]">SUB-{Date.now().toString().slice(-8)}</p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Status</p>
            <p className="mt-1 text-sm font-bold text-emerald-300">Pending Review</p>
          </div>
          <button className="mt-5 h-11 w-full rounded-xl bg-[#E11D2E] text-sm font-bold text-white">Report another issue</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111F] px-4 py-6 text-[#EEF3FA]">
      <div className="mx-auto max-w-sm overflow-hidden rounded-[2rem] border border-[rgba(46,127,255,0.24)] bg-[#0A1628] shadow-2xl">
        <div className="border-b border-[rgba(46,127,255,0.14)] bg-[linear-gradient(135deg,rgba(225,29,46,0.14),rgba(46,127,255,0.06))] p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#E11D2E]">4C360 FieldOps</div>
          <h1 className="mt-2 text-xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{survey.name}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#B8C7DB]"><MapPin size={13} /> {survey.siteIds.join(', ')} - {survey.assetIds.join(', ') || 'Site survey'}</p>
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-[#7A94B4]">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#112040]"><div className="h-full rounded-full bg-[#E11D2E]" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>

        <div className="space-y-3 p-4">
          {survey.questions.map(question => {
            const isDone = answered[question.id] || !question.required;
            const isSection = question.type === 'section';
            if (isSection) {
              return <h2 key={question.id} className="pt-2 text-[11px] font-black uppercase tracking-widest text-[#E11D2E]">{question.label}</h2>;
            }
            return (
              <div key={question.id} className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{question.label}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-[#7A94B4]">{question.type.replace('_', ' ')}</p>
                  </div>
                  {question.required && <span className="rounded-full bg-[#E11D2E]/12 px-2 py-1 text-[9px] font-bold text-red-200">Required</span>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {question.type === 'photo' && <button className="rounded-lg border border-[rgba(46,127,255,0.18)] px-3 py-2 text-[11px] font-bold text-[#B8C7DB]"><Camera size={13} className="mr-1 inline" />Photo</button>}
                  {question.type === 'voice' && <button className="rounded-lg border border-[rgba(46,127,255,0.18)] px-3 py-2 text-[11px] font-bold text-[#B8C7DB]"><Mic size={13} className="mr-1 inline" />Voice</button>}
                  {question.type === 'signature' && <button className="rounded-lg border border-[rgba(46,127,255,0.18)] px-3 py-2 text-[11px] font-bold text-[#B8C7DB]"><FileSignature size={13} className="mr-1 inline" />Sign</button>}
                  {question.type === 'qr_scan' && <button className="rounded-lg border border-[rgba(46,127,255,0.18)] px-3 py-2 text-[11px] font-bold text-[#B8C7DB]"><QrCode size={13} className="mr-1 inline" />Scan</button>}
                  <button
                    onClick={() => setAnswered(current => ({ ...current, [question.id]: !current[question.id] }))}
                    className={`rounded-lg px-3 py-2 text-[11px] font-bold ${isDone ? 'bg-emerald-400/12 text-emerald-300' : 'bg-[#E11D2E]/12 text-red-200'}`}
                  >
                    {isDone ? 'Completed' : 'Mark complete'}
                  </button>
                </div>
              </div>
            );
          })}
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-[11px] leading-5 text-emerald-200">
            <MapPin size={13} className="mr-1 inline" /> GPS captured inside approved site boundary.
          </div>
          {blocked && (
            <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-[11px] leading-5 text-amber-200">
              <ShieldAlert size={13} className="mr-1 inline" /> {blocked}
            </div>
          )}
          <button onClick={submit} className="h-12 w-full rounded-xl bg-[#E11D2E] text-sm font-bold text-white">Submit Survey</button>
        </div>
      </div>
    </div>
  );
}
