'use client';

import {useState} from 'react';
import {addDays, eachDayOfInterval, endOfMonth, format, parseISO, startOfMonth, startOfWeek} from 'date-fns';
import {Check, Clock3, FileText, Minus, Save, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {dateLabel, isTeachingDay, today} from '@/lib/dates';
import {rowTitle, type DataRow} from '@/lib/entities';
import {errorMessage} from '@/lib/validation';
import {supabase} from '@/lib/supabase';
import {useToday} from '@/hooks/use-today';
import {useApp} from './provider';
import {Badge, Empty, PageHeading} from './shared';

const statuses = ['Presente', 'Falta', 'Retraso', 'Xustificada'];
type AttendanceStatus = 'Presente' | 'Falta' | 'Retraso' | 'Xustificada' | 'Sen rexistrar';
type View = 'Rexistrar' | 'Hoxe' | 'Semana' | 'Mes';
const views: View[] = ['Rexistrar', 'Hoxe', 'Semana', 'Mes'];
function academicYearFor(day: string) {
  const year = Number(day.slice(0, 4));
  const start = Number(day.slice(5, 7)) >= 9 ? year : year - 1;
  return `${start}/${String(start + 1).slice(-2)}`;
}
const statusLabels: Record<AttendanceStatus, string> = {
  Presente: 'Asistiu',
  Falta: 'Non asistiu',
  Retraso: 'Retraso',
  Xustificada: 'Falta xustificada',
  'Sen rexistrar': 'Sen rexistrar',
};

function AttendanceMark({status, showLabel = false, accessible = true}: {status: AttendanceStatus; showLabel?: boolean; accessible?: boolean}) {
  const Icon = status === 'Presente' ? Check : status === 'Falta' ? X : status === 'Retraso' ? Clock3 : status === 'Xustificada' ? FileText : Minus;
  return <span className={`attendance-mark attendance-mark-${status === 'Sen rexistrar' ? 'unregistered' : status.toLowerCase()}`} title={statusLabels[status]}><Icon size={18} aria-hidden="true" />{showLabel ? <span>{statusLabels[status]}</span> : accessible && <span className="sr-only">{statusLabels[status]}</span>}</span>;
}

export function Attendance() {
  const {data} = useApp();
  const currentDay = useToday();
  const [date, setDate] = useState(today());
  const [group, setGroup] = useState('');
  const [mode, setMode] = useState<View>('Rexistrar');
  const pupils = data.students.filter(s => !group || s.group_id === group);
  const reportPupils = [...pupils].sort((a, b) => rowTitle('students', a).localeCompare(rowTitle('students', b), 'gl'));
  const records = new Map(data.attendance.map(r => [`${r.student_id}|${r.date}`, String(r.status)]));
  const statusFor = (studentId: string, day: string): AttendanceStatus => {
    const status = records.get(`${studentId}|${day}`);
    return statuses.includes(status || '') ? status as AttendanceStatus : 'Sen rexistrar';
  };
  const weekStart = startOfWeek(parseISO(date), {weekStartsOn: 1});
  const weekDays = Array.from({length: 5}, (_, index) => format(addDays(weekStart, index), 'yyyy-MM-dd'));
  const monthDays = eachDayOfInterval({start: startOfMonth(parseISO(date)), end: endOfMonth(parseISO(date))})
    .map(day => format(day, 'yyyy-MM-dd'))
    .filter(day => day <= currentDay && isTeachingDay(data, day, academicYearFor(day)));

  return <>
    <PageHeading eyebrow="UN XESTO, TODO O GRUPO" title="Faltas de asistencia" description="Pasa lista, rexistra ausencias e consulta o historial." />
    <div className="tabs">{views.map(view => <button key={view} className={mode === view ? 'active' : ''} onClick={() => setMode(view)}>{view}</button>)}</div>
    <div className="attendance-controls panel">
      {mode !== 'Hoxe' && <label>{mode === 'Semana' ? 'Semana de' : mode === 'Mes' ? 'Mes de' : 'Data'}<input type="date" value={date} required onChange={event => {if (event.target.value) setDate(event.target.value);}} /></label>}
      <label>Grupo<select value={group} onChange={event => setGroup(event.target.value)}><option value="">Todos os grupos</option>{data.groups.filter(g => !g.archived).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
    </div>
    {mode === 'Rexistrar' ? group ? <AttendanceRoll key={`${date}-${group}`} date={date} students={pupils} /> : <Empty title="Comeza por seleccionar un grupo" description="Verás o alumnado e poderás pasar lista cun só toque." /> :
      reportPupils.length ? <section className="panel attendance-report">
        <div className="panel-heading"><div><h2>{mode === 'Hoxe' ? 'Asistencia de hoxe' : mode === 'Semana' ? 'Asistencia semanal' : 'Resumo mensual'}</h2><p>{mode === 'Hoxe' ? dateLabel(currentDay, "EEEE, d 'de' MMMM") : mode === 'Semana' ? `${dateLabel(weekDays[0], 'd MMM')} – ${dateLabel(weekDays[4], 'd MMM yyyy')}` : dateLabel(date, 'MMMM yyyy')} · {reportPupils.length} alumnos/as</p></div></div>
        {mode !== 'Mes' && <div className="attendance-legend" aria-label="Lenda dos estados de asistencia">{(['Presente', 'Falta', 'Xustificada', 'Retraso', 'Sen rexistrar'] as AttendanceStatus[]).map(status => <span key={status}><AttendanceMark status={status} accessible={false} />{statusLabels[status]}</span>)}</div>}
        <div className="attendance-table-wrap"><table className="attendance-table">
          <caption className="sr-only">{mode === 'Hoxe' ? `Asistencia do ${dateLabel(currentDay)}` : mode === 'Semana' ? `Asistencia da semana do ${dateLabel(weekDays[0])}` : `Resumo de asistencia de ${dateLabel(date, 'MMMM yyyy')}`}</caption>
          <thead><tr><th scope="col">Alumno/a</th>{mode === 'Hoxe' ? <><th scope="col">Data</th><th scope="col">Estado</th></> : mode === 'Semana' ? weekDays.map(day => <th scope="col" key={day}>{dateLabel(day, 'EEE d MMM')}</th>) : <><th scope="col">Asistiu</th><th scope="col">Non asistiu</th><th scope="col">Xustificada</th><th scope="col">Retrasos</th><th scope="col">Sen rexistrar</th></>}</tr></thead>
          <tbody>{reportPupils.map(pupil => <tr key={pupil.id}><th scope="row">{rowTitle('students', pupil)}</th>{mode === 'Hoxe' ? <><td>{dateLabel(currentDay)}</td><td><AttendanceMark status={statusFor(pupil.id, currentDay)} showLabel /></td></> : mode === 'Semana' ? weekDays.map(day => <td key={day}><AttendanceMark status={statusFor(pupil.id, day)} /></td>) : (['Presente', 'Falta', 'Xustificada', 'Retraso', 'Sen rexistrar'] as AttendanceStatus[]).map(status => <td key={status} className="attendance-count">{monthDays.filter(day => statusFor(pupil.id, day) === status).length}</td>)}</tr>)}</tbody>
        </table></div>
        {mode === 'Mes' && <p className="attendance-note">O resumo conta os días lectivos transcorridos. Os retrasos figuran nunha columna propia.</p>}
      </section> : <Empty title="Aínda non hai alumnado nesta selección" description="Engade alumnado ou escolle outro grupo para consultar a asistencia." />}
  </>;
}

function AttendanceRoll({date, students}: {date: string; students: DataRow[]}) {
  const {data, user, reload, notice} = useApp();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const existing = data.attendance.filter(r => r.date === date);
  const status = (id: string) => draft[id] ?? existing.find(r => r.student_id === id)?.status ?? '';
  const save = async () => {
    if (!Object.keys(draft).length) return;
    setBusy(true);
    try {
      const rows = Object.entries(draft).map(([student_id, status]) => ({user_id: user!.id, student_id, date, status}));
      const {error} = await supabase().from('attendance').upsert(rows, {onConflict: 'user_id,student_id,date'});
      if (error) throw error;
      await reload();
      setDraft({});
      notice('Asistencia gardada correctamente');
    } catch (error) {
      notice(errorMessage(error), true);
    } finally {
      setBusy(false);
    }
  };
  return <section className="panel"><div className="panel-heading"><div><h2>{dateLabel(date, "EEEE, d 'de' MMMM")}</h2><p>{students.length} alumnos/as · {students.filter(s => status(s.id)).length} rexistrados</p></div><Button variant="outline" disabled={busy || !students.length} onClick={() => setDraft(Object.fromEntries(students.map(s => [s.id, 'Presente'])))}><Check size={17} />Todos presentes</Button></div>{students.length ? <div className="attendance-list">{students.map(s => <div className="attendance-row" key={s.id}><div className="attendance-student"><div className="avatar">{String(s.first_name).slice(0, 1)}</div><strong>{rowTitle('students', s)}</strong>{!status(s.id) && <Badge tone="gray">Sen rexistrar</Badge>}</div><fieldset className="status-options" aria-label={`Asistencia de ${rowTitle('students', s)}`}>{statuses.map((value, index) => <button disabled={busy} key={value} aria-pressed={status(s.id) === value} className={`status-option status-${index} ${status(s.id) === value ? 'selected' : ''}`} onClick={() => setDraft({...draft, [s.id]: value})}>{value}</button>)}</fieldset></div>)}</div> : <Empty title="Este grupo aínda non ten alumnado" description="Engade alumnado na súa sección antes de pasar lista." />}<div className="attendance-save"><span>{Object.keys(draft).length ? `${Object.keys(draft).length} cambios pendentes` : 'Sen cambios pendentes'}</span><Button className="primary" disabled={busy || !Object.keys(draft).length} onClick={() => void save()}><Save size={17} />{busy ? 'Gardando…' : 'Gardar asistencia'}</Button></div></section>;
}
