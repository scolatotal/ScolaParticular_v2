'use client';
import { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { rowTitle, type EntityName, type DataRow } from '@/lib/entities';
import { weekdays } from '@/lib/dates';
import { useApp } from './provider';
import { PageHeading, Collection } from './shared';
import { Modal, RecordDetails } from './editor';

function isSupportSession(name: string) {
  const normalized = name.trim().toLocaleLowerCase('gl');
  return /^(gardas?|ld)(?:\s|$)/.test(normalized) ||
    ['libre disposición', 'polos creativos'].includes(normalized);
}

function isBreakSession(name: string) {
  const normalized = name.trim().toLocaleLowerCase('gl');
  return normalized.includes('recreo') || normalized === 'hora de ler';
}

export function Schedules() {
  const { data, edit } = useApp();
  const [mode, setMode] = useState('Meu horario'),
    [group, setGroup] = useState(''),
    [subjects, setSubjects] = useState(false);
  const [selectedSession, setSelectedSession] = useState<{
    table: EntityName;
    row: DataRow;
  } | null>(null);
  const table: EntityName =
    mode === 'Meu horario' ? 'teacher_schedules' : 'group_schedules';
  const year = data.profiles[0]?.academic_year || '2026/27';
  const yearRows = data[table].filter((r) => r.academic_year === year);
  const teacherRows = data.teacher_schedules.filter(
    (r) => r.academic_year === year,
  );
  const matchesTeacherSlot = (
    weekday: number,
    start: string,
    end: string,
    groupId: string,
  ) =>
    mode === 'Horario do alumnado' &&
    Boolean(groupId) &&
    teacherRows.some(
      (r) =>
        r.weekday === weekday &&
        String(r.start_time).slice(0, 5) === start &&
        String(r.end_time).slice(0, 5) === end &&
        r.group_id === groupId,
    );
  const rows = yearRows.filter(
    (r) => !group || r.group_id === group || (table === 'teacher_schedules' && !r.group_id),
  );
  // Share the same time slots across all weekdays, even when a day has gaps.
  const slots = [...new Map(yearRows.map((r) => {
    const start = String(r.start_time).slice(0, 5);
    const end = String(r.end_time).slice(0, 5);
    return [`${start}-${end}`, { start, end }] as const;
  })).values()].sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
  return (
    <>
      <PageHeading
        eyebrow="O RITMO DA TÚA SEMANA"
        title="Os meus horarios"
        description="Cada materia, grupo e aula no seu lugar."
        actions={
          <div className="button-row">
            <Button variant="outline" onClick={() => setSubjects(true)}>
              <BookOpen />
              Materias
            </Button>
            <Button
              className="primary"
              onClick={() =>
                edit(table, undefined, {
                  academic_year: String(year),
                  ...(group ? { group_id: group } : {}),
                })
              }
            >
              <Plus />
              Nova sesión
            </Button>
          </div>
        }
      />
      <div className="calendar-toolbar">
        <div className="tabs">
          {['Meu horario', 'Horario do alumnado'].map((t) => (
            <button
              className={mode === t ? 'active' : ''}
              key={t}
              onClick={() => setMode(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <select
          aria-label="Grupo do horario"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
        >
          <option value="">Todos os grupos</option>
          {data.groups.map((g) => (
            <option value={g.id} key={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      {!data.subjects.length && (
        <div className="info-banner">
          Crea primeiro as materias para poder configurar as sesións.
        </div>
      )}
      <div className="schedule-week">
        {weekdays.slice(0, 5).map((day, index) => (
          <section className="schedule-day" key={day}>
            <h2>
              {day}
              <span>
                {rows.filter((r) => r.weekday === index + 1).length} sesións
              </span>
            </h2>
            <div className="schedule-sessions">
              {slots.flatMap(({ start, end }) => {
                const breakSlot = yearRows.some((r) =>
                  String(r.start_time).slice(0, 5) === start &&
                  String(r.end_time).slice(0, 5) === end &&
                  isBreakSession(String(data.subjects.find((s) => s.id === r.subject_id)?.name || '')),
                );
                const sessions = rows.filter((r) =>
                  r.weekday === index + 1 &&
                  String(r.start_time).slice(0, 5) === start &&
                  String(r.end_time).slice(0, 5) === end,
                );
                if (!sessions.length) {
                  return [
                    <button
                      type="button"
                      key={`empty-${start}-${end}`}
                      className={`schedule-card ${breakSlot ? 'schedule-card-break' : 'schedule-card-support'}${matchesTeacherSlot(index + 1, start, end, group) ? ' schedule-card-teacher-match' : ''}`}
                      aria-label={`Engadir sesión: ${day}, ${start}–${end}`}
                      aria-haspopup="dialog"
                      onClick={() => edit(table, undefined, {
                        weekday: index + 1,
                        start_time: start,
                        end_time: end,
                        academic_year: String(year),
                        ...(group ? { group_id: group } : {}),
                      })}
                    >
                      {!breakSlot && <span className="schedule-time">{start} – {end}</span>}
                    </button>,
                  ];
                }
                return sessions.map((r) => {
                  const subject = data.subjects.find((s) => s.id === r.subject_id);
                  const breakSession = isBreakSession(String(subject?.name || ''));
                  const blank = breakSession && !r.group_id && !r.show_without_group;
                  const matchesTeacherSchedule = matchesTeacherSlot(
                    index + 1,
                    start,
                    end,
                    String(r.group_id || ''),
                  );
                  return (
                    <button
                      type="button"
                      key={r.id}
                      className={`schedule-card${breakSession ? ' schedule-card-break' : isSupportSession(String(subject?.name || '')) ? ' schedule-card-support' : ''}${matchesTeacherSchedule ? ' schedule-card-teacher-match' : ''}`}
                      aria-label={blank ? `Editar franxa sen grupo: ${day}, ${start}–${end}` : undefined}
                      onClick={() => setSelectedSession({ table, row: r })}
                      aria-haspopup="dialog"
                    >
                      {!blank && <>
                      <span className="schedule-time">{start} – {end}</span>
                      <strong className="schedule-subject">
                        {rowTitle(table, r, data)}
                      </strong>
                      {r.group_id && (
                        <span className="schedule-detail">
                          {data.groups.find((g) => g.id === r.group_id)?.name}
                        </span>
                      )}
                      {r.room && <span className="schedule-detail">{r.room}</span>}
                      {r.teacher && <span className="schedule-detail">{r.teacher}</span>}
                      </>}
                    </button>
                  );
                });
              })}
              <button
                className="dotted-action"
                onClick={() =>
                  edit(table, undefined, {
                    weekday: index + 1,
                    academic_year: String(year),
                    ...(group ? { group_id: group } : {}),
                  })
                }
              >
                <Plus size={16} />
                Sesión
              </button>
            </div>
          </section>
        ))}
      </div>
      {subjects && (
        <Modal title="As miñas materias" onClose={() => setSubjects(false)}>
          <Collection table="subjects" />
        </Modal>
      )}
      {selectedSession && (
        <RecordDetails
          table={selectedSession.table}
          row={selectedSession.row}
          onClose={() => setSelectedSession(null)}
        />
      )}
      <p className="source-note">
        No inicio móstranse as sesións de «Meu horario» para o día da semana
        actual. A axenda mostra as datas importantes, conmemoracións e días non
        lectivos do calendario escolar, xunto cos eventos que crees.
      </p>
    </>
  );
}
