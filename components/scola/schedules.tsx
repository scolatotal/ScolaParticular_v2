'use client';
import { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { rowTitle, type EntityName, type DataRow } from '@/lib/entities';
import { weekdays } from '@/lib/dates';
import { useApp } from './provider';
import { PageHeading, Collection } from './shared';
import { Modal, RecordDetails } from './editor';

function subjectColors(color: string) {
  const backgroundColor = /^#[0-9a-f]{6}$/i.test(color) ? color : '#0070c0';
  const [red, green, blue] = [1, 3, 5].map((offset) => {
    const channel =
      parseInt(backgroundColor.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  return { backgroundColor, color: luminance > 0.179 ? '#000000' : '#ffffff' };
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
  const rows = data[table]
    .filter((r) => (!group || r.group_id === group) && r.academic_year === year)
    .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
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
              {rows
                .filter((r) => r.weekday === index + 1)
                .map((r) => {
                  const subject = data.subjects.find(
                    (s) => s.id === r.subject_id,
                  );
                  return (
                    <button
                      type="button"
                      key={r.id}
                      className="schedule-card"
                      style={subjectColors(String(subject?.color || ''))}
                      onClick={() => setSelectedSession({ table, row: r })}
                      aria-haspopup="dialog"
                    >
                      <span className="schedule-time">
                        {String(r.start_time).slice(0, 5)} –{' '}
                        {String(r.end_time).slice(0, 5)}
                      </span>
                      <strong className="schedule-subject">
                        {rowTitle(table, r, data)}
                      </strong>
                      <span className="schedule-detail">
                        {data.groups.find((g) => g.id === r.group_id)?.name}
                      </span>
                      {r.room && (
                        <span className="schedule-detail">{r.room}</span>
                      )}
                      {r.teacher && (
                        <span className="schedule-detail">{r.teacher}</span>
                      )}
                    </button>
                  );
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
