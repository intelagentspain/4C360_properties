import { useMemo, useState } from 'react';
import { Camera, CheckCircle2, FileSignature, MapPin, Mic, QrCode, ShieldAlert } from 'lucide-react';
import { assignments, surveys, type SurveyQuestion, type SurveySubmission } from './data';
import { appendLocalFieldOpsSubmission } from './liveSubmissions';

export function FieldOpsCapture({ surveyId }: { surveyId: string }) {
  const survey = useMemo(() => surveys.find(item => item.id === surveyId) ?? surveys[0], [surveyId]);
  const assignment = useMemo(() => assignments.find(item => item.surveyId === survey.id) ?? assignments[0], [survey.id]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [photoUploads, setPhotoUploads] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState('');
  const [blocked, setBlocked] = useState('');

  const required = survey.questions.filter(question => question.required);
  const isQuestionComplete = (question: SurveyQuestion) => {
    if (question.type === 'section' || !question.required) return true;
    if (question.type === 'photo' || question.evidenceRequired) return (photoUploads[question.id] ?? []).length > 0;
    return (answers[question.id] ?? '').trim().length > 0;
  };
  const completeCount = required.filter(isQuestionComplete).length;
  const progress = required.length ? Math.round((completeCount / required.length) * 100) : 100;

  const updateAnswer = (questionId: string, value: string) => {
    setAnswers(current => ({ ...current, [questionId]: value }));
    setBlocked('');
  };

  const handlePhotoUpload = (questionId: string, fileList: FileList | null) => {
    const fileNames = Array.from(fileList ?? []).map(file => file.name);
    if (!fileNames.length) return;

    setPhotoUploads(current => {
      const nextFiles = [...(current[questionId] ?? []), ...fileNames];
      setAnswers(answerCurrent => ({
        ...answerCurrent,
        [questionId]: `${nextFiles.length} photo${nextFiles.length === 1 ? '' : 's'} uploaded`,
      }));
      return { ...current, [questionId]: nextFiles };
    });
    setBlocked('');
  };

  const getDefaultAnswer = (question: SurveyQuestion) => {
    if (question.type === 'pass_fail') return 'Pass';
    if (question.type === 'yes_no') return 'Yes';
    if (question.type === 'photo') return 'Photo uploaded';
    if (question.type === 'signature') return 'Signature captured';
    if (question.type === 'qr_scan') return 'QR scanned';
    if (question.type === 'gps') return 'GPS captured';
    return 'Completed';
  };

  const submit = async () => {
    if (progress < 100) {
      setBlocked('Complete all mandatory questions and required evidence before submitting.');
      return;
    }

    const newSubmissionId = `SUB-${Date.now().toString().slice(-8)}`;
    const answerRows = survey.questions
      .filter(question => question.type !== 'section')
      .map(question => ({
        question: question.label,
        answer: answers[question.id] || getDefaultAnswer(question),
      }));
    const issueCount = answerRows.filter(row => /fail|no|blocked|abnormal|issue|defect/i.test(row.answer)).length;
    const uploadedPhotoEvidence = Object.entries(photoUploads).flatMap(([questionId, fileNames]) => {
      const question = survey.questions.find(item => item.id === questionId);
      return fileNames.map(fileName => ({
        type: 'photo' as const,
        label: `${question?.label ?? 'Photo evidence'} - ${fileName}`,
      }));
    });
    const nonPhotoEvidence = survey.questions
      .filter(question => question.type === 'signature' || question.type === 'voice')
      .map(question => ({
        type: question.type === 'signature' ? 'signature' as const : question.type === 'voice' ? 'voice' as const : 'photo' as const,
        label: question.label,
      }));
    const evidence = [...uploadedPhotoEvidence, ...nonPhotoEvidence];
    const submission: SurveySubmission = {
      id: newSubmissionId,
      surveyId: survey.id,
      assignmentId: assignment.id,
      submittedBy: 'Email recipient',
      answers: answerRows,
      evidence,
      gpsLocation: { lat: 25.2048, lng: 55.2708, site: survey.siteIds[0] ?? assignment.site },
      status: 'Pending Review',
      issuesDetected: issueCount,
      score: Math.max(55, 100 - issueCount * 14),
      submittedAt: 'Just now',
      reviewer: 'Sarah Khan',
    };

    appendLocalFieldOpsSubmission(submission);
    setSubmissionId(newSubmissionId);
    setSubmitted(true);

    fetch('/api/fieldops/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    }).catch(() => {
      // Local storage keeps the dashboard demo live even if the API is offline.
    });
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
            <p className="mt-1 font-mono text-sm font-bold text-[#EEF3FA]">{submissionId}</p>
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
            const value = answers[question.id] ?? '';
            const uploadedPhotos = photoUploads[question.id] ?? [];
            const requiresPhoto = question.type === 'photo' || question.evidenceRequired;
            const isDone = isQuestionComplete(question);
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
                {['text', 'numeric'].includes(question.type) && (
                  <input
                    value={value}
                    onChange={event => updateAnswer(question.id, event.target.value)}
                    placeholder={question.type === 'numeric' ? 'Enter reading' : 'Enter notes'}
                    className="mt-3 h-10 w-full rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 text-sm text-[#EEF3FA] outline-none focus:border-[#E11D2E]"
                  />
                )}
                {question.type === 'single_choice' && (
                  <select
                    value={value}
                    onChange={event => updateAnswer(question.id, event.target.value)}
                    className="mt-3 h-10 w-full rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 text-sm text-[#EEF3FA] outline-none focus:border-[#E11D2E]"
                  >
                    <option value="">Select answer</option>
                    {(question.options ?? ['Excellent', 'Good', 'Needs attention']).map(option => <option key={option}>{option}</option>)}
                  </select>
                )}
                {['pass_fail', 'yes_no'].includes(question.type) && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {(question.type === 'pass_fail' ? ['Pass', 'Fail'] : ['Yes', 'No']).map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateAnswer(question.id, option)}
                        className={`rounded-lg border px-3 py-2 text-[11px] font-bold ${value === option ? 'border-[#E11D2E]/55 bg-[#E11D2E]/15 text-white' : 'border-[rgba(46,127,255,0.18)] bg-[#0A1628] text-[#B8C7DB]'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {requiresPhoto && (
                    <label className="cursor-pointer rounded-lg border border-[rgba(46,127,255,0.18)] px-3 py-2 text-[11px] font-bold text-[#B8C7DB] transition hover:border-[#E11D2E]/55 hover:text-white">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        className="sr-only"
                        onChange={event => handlePhotoUpload(question.id, event.target.files)}
                      />
                      <Camera size={13} className="mr-1 inline" />
                      {uploadedPhotos.length ? `${uploadedPhotos.length} photo${uploadedPhotos.length === 1 ? '' : 's'}` : 'Upload photo'}
                    </label>
                  )}
                  {question.type === 'voice' && <button onClick={() => updateAnswer(question.id, 'Voice note uploaded')} className="rounded-lg border border-[rgba(46,127,255,0.18)] px-3 py-2 text-[11px] font-bold text-[#B8C7DB]"><Mic size={13} className="mr-1 inline" />Voice</button>}
                  {question.type === 'signature' && <button onClick={() => updateAnswer(question.id, 'Signature captured')} className="rounded-lg border border-[rgba(46,127,255,0.18)] px-3 py-2 text-[11px] font-bold text-[#B8C7DB]"><FileSignature size={13} className="mr-1 inline" />Sign</button>}
                  {question.type === 'qr_scan' && <button onClick={() => updateAnswer(question.id, 'QR scanned')} className="rounded-lg border border-[rgba(46,127,255,0.18)] px-3 py-2 text-[11px] font-bold text-[#B8C7DB]"><QrCode size={13} className="mr-1 inline" />Scan</button>}
                  <button
                    onClick={() => {
                      if (requiresPhoto && !uploadedPhotos.length) {
                        setBlocked('Upload photo evidence for this required check first.');
                        return;
                      }
                      updateAnswer(question.id, isDone ? '' : getDefaultAnswer(question));
                    }}
                    className={`rounded-lg px-3 py-2 text-[11px] font-bold ${isDone ? 'bg-emerald-400/12 text-emerald-300' : 'bg-[#E11D2E]/12 text-red-200'}`}
                  >
                    {isDone ? 'Completed' : requiresPhoto ? 'Photo required' : 'Mark complete'}
                  </button>
                </div>
                {uploadedPhotos.length > 0 && (
                  <div className="mt-3 space-y-1 rounded-lg border border-emerald-400/15 bg-emerald-400/5 p-2">
                    {uploadedPhotos.map(fileName => (
                      <p key={fileName} className="truncate text-[10px] font-semibold text-emerald-200">
                        <Camera size={11} className="mr-1 inline" />
                        {fileName}
                      </p>
                    ))}
                  </div>
                )}
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
