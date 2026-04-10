import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { mockKanbanTasks } from '@/data/mockData';
import { TaskDetailSheet } from './TaskDetailSheet';

type Task = typeof mockKanbanTasks[0];
type Status = 'new' | 'assigned' | 'in-progress' | 'awaiting-evidence' | 'closed' | 'overdue';

const columns: { id: Status; label: string; accent: string; bg: string }[] = [
  { id: 'new', label: 'New', accent: '#7A94B4', bg: 'rgba(122,148,180,0.1)' },
  { id: 'assigned', label: 'Assigned', accent: '#2E7FFF', bg: 'rgba(46,127,255,0.1)' },
  { id: 'in-progress', label: 'In Progress', accent: '#00C6FF', bg: 'rgba(0,198,255,0.1)' },
  { id: 'awaiting-evidence', label: 'Evidence', accent: '#FF9B38', bg: 'rgba(255,155,56,0.1)' },
  { id: 'closed', label: 'Closed', accent: '#38D98A', bg: 'rgba(56,217,138,0.1)' },
  { id: 'overdue', label: 'Overdue', accent: '#FF4B4B', bg: 'rgba(255,75,75,0.1)' },
];

const priorityDot: Record<string, string> = {
  critical: 'bg-red-400',
  high: 'bg-orange-400',
  medium: 'bg-amber-400',
  low: 'bg-[#7A94B4]',
};

interface Props {
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export function KanbanBoard({ onToast }: Props) {
  const [tasks, setTasks] = useState(mockKanbanTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeCol, setActiveCol] = useState<Status>('new');

  const colTasks = (status: Status) => tasks.filter(t => t.status === status);

  const slaLabel = (task: Task) => {
    const left = task.slaMinutes - task.elapsed;
    if (left <= 0) return { text: 'OVERDUE', color: '#FF4B4B' };
    if (left <= 15) return { text: `${left}m`, color: '#FF4B4B' };
    if (left <= 30) return { text: `${left}m`, color: '#FF9B38' };
    return { text: `${left}m`, color: '#7A94B4' };
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-1.5 px-3 pt-3 pb-2 overflow-x-auto no-scrollbar flex-shrink-0">
        {columns.map(col => {
          const count = colTasks(col.id).length;
          const isActive = activeCol === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setActiveCol(col.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold transition-all border ${
                isActive ? 'text-white' : 'text-[#7A94B4] border-transparent hover:text-[#EEF3FA]'
              }`}
              style={isActive ? { background: col.bg, borderColor: col.accent + '60', color: col.accent } : {}}
            >
              {col.label}
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: isActive ? col.accent + '30' : 'rgba(255,255,255,0.06)', color: isActive ? col.accent : '#7A94B4' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
        {(() => {
          const col = columns.find(c => c.id === activeCol)!;
          const list = colTasks(activeCol);
          return (
            <motion.div
              key={activeCol}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between py-1">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: col.accent }}>
                  {col.label} · {list.length} task{list.length !== 1 ? 's' : ''}
                </span>
                {activeCol === 'new' && (
                  <button
                    onClick={() => onToast('Opening new task form', 'info')}
                    className="flex items-center gap-1 text-[10px] text-[#7A94B4] hover:text-white transition-colors"
                  >
                    <Plus size={11} /> Add Task
                  </button>
                )}
              </div>

              {list.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <CheckCircle size={28} className="text-[#7A94B4] opacity-30" />
                  <span className="text-[11px] text-[#7A94B4] opacity-60">No tasks in this column</span>
                </div>
              )}

              {list.map(task => {
                const sla = slaLabel(task);
                return (
                  <motion.button
                    key={task.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTask(task)}
                    className="w-full text-left bg-[#112040] rounded-xl border border-[rgba(46,127,255,0.2)] p-3 hover:border-[rgba(46,127,255,0.45)] transition-all"
                    style={{ borderLeftWidth: 3, borderLeftColor: col.accent }}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${priorityDot[task.priority]}`} />
                      <span className="text-[12px] text-[#EEF3FA] font-semibold leading-snug flex-1">{task.title}</span>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {sla.text === 'OVERDUE' && <AlertTriangle size={10} style={{ color: sla.color }} />}
                        <span className="text-[10px] font-bold font-mono" style={{ color: sla.color }}>{sla.text}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {task.tech && (
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 rounded-full bg-[#2E7FFF]/30 border border-[#2E7FFF]/40 flex items-center justify-center text-[8px] text-[#2E7FFF] font-bold">
                            {task.tech.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-[10px] text-[#7A94B4]">{task.tech}</span>
                        </div>
                      )}
                      {!task.tech && <span className="text-[10px] text-[#7A94B4] italic">Unassigned</span>}
                      <div className="flex items-center gap-1 ml-auto">
                        <MapPin size={9} className="text-[#7A94B4]" />
                        <span className="text-[9px] text-[#7A94B4] truncate max-w-[90px]">{task.location}</span>
                      </div>
                    </div>

                    {task.status === 'awaiting-evidence' && task.evidence.length === 0 && (
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[rgba(255,155,56,0.2)]">
                        <AlertTriangle size={9} className="text-amber-400" />
                        <span className="text-[9px] text-amber-400">Evidence upload required</span>
                      </div>
                    )}
                    {(task.status === 'closed') && (
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[rgba(56,217,138,0.2)]">
                        <CheckCircle size={9} className="text-emerald-400" />
                        <span className="text-[9px] text-emerald-400">{task.evidence.length} evidence file{task.evidence.length !== 1 ? 's' : ''} attached</span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          );
        })()}
      </div>

      <div className="relative">
        <TaskDetailSheet
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onToast={onToast}
        />
      </div>
    </div>
  );
}
