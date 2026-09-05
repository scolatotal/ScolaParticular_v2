'use client';

import { useState } from 'react';
import { AppLink as Link } from './app-link';
import {
  CalendarDays,
  Users,
  ClipboardCheck,
  MessagesSquare,
  ListChecks,
  ArrowRight,
  Plus,
  NotebookPen,
  Clock,
  BookOpen,
  ArrowUpRight,
  Link2,
  Building2,
  Settings,
  FilePlus2,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react';
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  agendaForDay,
  classesForDay,
  dateLabel,
  reminderDue,
  type AgendaItem,
} from '@/lib/dates';
import { textValue, type EntityName } from '@/lib/entities';
import { useToday } from '@/hooks/use-today';
import { useApp } from './provider';
import { Panel, Empty } from './shared';
import { RecordDetails } from './editor';

export function AgendaList({
  items,
  empty = true,
}: {
  items: AgendaItem[];
  empty?: boolean;
}) {
  const { data } = useApp();
  const [selected, setSelected] = useState<AgendaItem | null>(null);
  return (
    <>
      {items.length ? (
        <div className="agenda-list">
          {items.map((item) => {
            const group = data.groups.find((g) => g.id === item.row.group_id);
            return (
              <button
                className={`agenda-row ${item.kind === 'Clase' ? 'class-row' : ''}`}
                key={item.id}
                onClick={() => setSelected(item)}
              >
                <span className="agenda-time">
                  {item.time ? item.time.slice(0, 5) : 'Todo o día'}
                  {item.endTime && <> – {item.endTime.slice(0, 5)}</>}
                </span>
                <span className="agenda-description">
                  <strong>{item.title}</strong>
                  <small>{group?.name || item.kind}</small>
                </span>
                <span className="agenda-location">
                  {item.location || <ArrowUpRight size={16} />}
                </span>
              </button>
            );
          })}
        </div>
      ) : empty ? (
        <Empty
          title="Tes este espazo libre"
          description="Os eventos que programes aparecerán aquí."
        />
      ) : null}
      {selected && (
        <RecordDetails
          table={selected.table}
          row={selected.row}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

type Shortcut =
  | { label: string; icon: LucideIcon; href: string }
  | { label: string; icon: LucideIcon; entity: EntityName };
const shortcuts: Shortcut[] = [
  { label: 'Novo evento', icon: CalendarDays, entity: 'calendar_events' },
  { label: 'Alumnado e grupos', icon: Users, href: '/alumnado' },
  { label: 'Rexistrar falta', icon: ClipboardCheck, href: '/faltas' },
  { label: 'Nova titoría', icon: MessagesSquare, entity: 'tutoring_sessions' },
  { label: 'Nova tarefa', icon: ListChecks, entity: 'tasks' },
  { label: 'Diario docente', icon: NotebookPen, href: '/diario' },
  { label: 'Datos do centro', icon: Building2, href: '/centro' },
  { label: 'Horarios', icon: Clock, href: '/horarios' },
  { label: 'A miña axenda', icon: CalendarDays, href: '/axenda' },
  { label: 'Nova entrada', icon: FilePlus2, entity: 'diary_entries' },
  { label: 'Engadir alumno/a', icon: Users, entity: 'students' },
  { label: 'Configuración', icon: Settings, href: '/configuracion' },
];

export function Dashboard() {
  const { data, edit } = useApp();
  const day = useToday(),
    profile = data.profiles[0];
  const name = textValue(profile, 'first_name') || 'docente';
  const year = textValue(profile, 'academic_year') || '2026/27';
  const school =
    data.schools.find((s) => s.id === profile?.school_id) ?? data.schools[0];
  const items = agendaForDay(data, day, year),
    classes = classesForDay(data, day, year);
  const weekStart = startOfWeek(parseISO(day), { weekStartsOn: 1 });
  const weekStartDay = format(weekStart, 'yyyy-MM-dd');
  const weekEndDay = format(addDays(weekStart, 6), 'yyyy-MM-dd');
  const weeklyAgenda = Array.from({ length: 7 }, (_, offset) => {
    const agendaDay = format(addDays(weekStart, offset), 'yyyy-MM-dd');
    return {
      day: agendaDay,
      items: agendaForDay(data, agendaDay, year).filter(
        (item) => item.kind !== 'Clase',
      ),
    };
  }).filter((entry) => entry.items.length > 0);
  const absence = data.attendance.filter(
    (r) => r.date === day && r.status === 'Falta',
  ).length;
  const upcomingTutors = data.tutoring_sessions.filter(
    (r) => String(r.date) >= day && r.status === 'Programada',
  );
  const pendingTasks = data.tasks.filter((r) => !r.completed);
  const nextDay = format(addDays(parseISO(day), 1), 'yyyy-MM-dd');
  const reminders = [
    ...items.filter((i) => reminderDue(i, day)),
    ...agendaForDay(data, nextDay, year).filter((i) => reminderDue(i, nextDay)),
  ];
  const stats = [
    ['Faltas de hoxe', absence, ClipboardCheck, '/faltas'],
    [
      'Eventos próximos',
      data.calendar_events.filter(
        (r) => String(r.ends_on) >= day || String(r.repeat_until) >= day,
      ).length,
      CalendarDays,
      '/axenda',
    ],
    ['Alumnado', data.students.length, Users, '/alumnado'],
    ['Clases de hoxe', classes.length, Clock, '/horarios'],
  ] as const;

  return (
    <div className="dashboard">
      <section className="welcome">
        <div>
          <h1>Benvido/a, {name}</h1>
          <p>{dateLabel(day, "EEEE, d 'de' MMMM 'de' yyyy")}</p>
        </div>
        <Link
          href="/centro"
          className="welcome-school"
          aria-label="Editar datos do centro"
        >
          <Building2 size={16} />
          <span>
            Centro:{' '}
            {school
              ? `${school.code ? `${school.code} · ` : ''}${school.name}`
              : 'Engade o teu centro'}
          </span>
        </Link>
      </section>

      <div className="stats-grid">
        {stats.map(([label, value, Icon, path]) => (
          <Link href={path} className="stat-card" key={label}>
            <div className="stat-icon">
              <Icon size={24} />
            </div>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </Link>
        ))}
      </div>

      {reminders.length > 0 && (
        <div className="reminder-strip">
          <Clock size={18} />
          {reminders.length} recordatorio(s):{' '}
          {reminders.map((i) => i.title).join(' · ')}
        </div>
      )}

      <div className="dashboard-primary-grid">
        <Panel
          title="Clases do día"
          icon={<Clock size={21} />}
          className="classes-panel"
        >
          {classes.length ? (
            <AgendaList items={classes} />
          ) : (
            <div className="classes-empty">
              <div className="empty-icon">
                <BookOpen size={30} />
              </div>
              <h3>Hoxe non tes clases programadas</h3>
              <p>
                As sesións que rexistres en «Meu horario» para este día da
                semana aparecerán aquí coa materia, a hora, o grupo e a aula.
              </p>
              <Link className="outline-link" href="/horarios">
                <Clock size={16} />
                Configurar horario
              </Link>
            </div>
          )}
          <Link href="/horarios" className="panel-bottom-link">
            Ver o horario completo <ArrowRight size={15} />
          </Link>
        </Panel>
        <Panel
          title="Axenda semanal"
          icon={<CalendarDays size={20} />}
          link="/axenda"
        >
          <p className="weekly-agenda-range">
            {dateLabel(weekStartDay, 'd MMM')} –{' '}
            {dateLabel(weekEndDay, 'd MMM yyyy')}
          </p>
          {weeklyAgenda.length ? (
            <div className="weekly-agenda">
              {weeklyAgenda.map((entry) => (
                <section className="weekly-agenda-day" key={entry.day}>
                  <h3>
                    <time dateTime={entry.day}>
                      {dateLabel(entry.day, 'EEEE, d MMMM')}
                    </time>
                    {entry.day === day && <span>Hoxe</span>}
                  </h3>
                  <AgendaList items={entry.items} />
                </section>
              ))}
            </div>
          ) : (
            <Empty
              title="Non hai eventos nesta semana"
              description="Os eventos, encontros e datas do calendario desta semana aparecerán aquí."
            />
          )}
          <button
            className="dotted-action"
            onClick={() => edit('calendar_events')}
          >
            <Plus size={17} />
            Engadir un evento
          </button>
        </Panel>
      </div>

      <div className="dashboard-secondary-grid">
        <Panel
          title="Enlaces rápidos"
          icon={<Link2 size={21} />}
          className="quick-panel"
        >
          <div className="quick-grid">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              const content = (
                <>
                  <Icon size={25} />
                  <span>{shortcut.label}</span>
                </>
              );
              return 'href' in shortcut ? (
                <Link key={shortcut.label} href={shortcut.href}>
                  {content}
                </Link>
              ) : (
                <button
                  key={shortcut.label}
                  onClick={() => edit(shortcut.entity)}
                >
                  {content}
                </button>
              );
            })}
          </div>
        </Panel>
        <Panel title="Seguimento" icon={<ListChecks size={20} />}>
          <div className="meeting-summary">
            <Link href="/titorias">
              <MessagesSquare size={22} />
              <span>Próximas titorías</span>
              <strong>{upcomingTutors.length}</strong>
              <ArrowRight size={15} />
            </Link>
            <Link href="/tarefas">
              <ListChecks size={22} />
              <span>Tarefas pendentes</span>
              <strong>{pendingTasks.length}</strong>
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="group-overview">
            <h3>
              <FolderOpen size={18} /> Os meus grupos
            </h3>
            {data.groups.filter((g) => !g.archived).length ? (
              <div className="group-summary">
                {data.groups
                  .filter((g) => !g.archived)
                  .map((g) => (
                    <Link href={`/alumnado?grupo=${g.id}`} key={g.id}>
                      <strong>{g.name}</strong>
                      <span>
                        {
                          data.students.filter((s) => s.group_id === g.id)
                            .length
                        }{' '}
                        alumnos/as
                      </span>
                      <ArrowRight size={14} />
                    </Link>
                  ))}
              </div>
            ) : (
              <div className="onboarding">
                <p>Aínda non tes grupos.</p>
                <Button variant="outline" onClick={() => edit('groups')}>
                  <Plus size={16} />
                  Crear grupo
                </Button>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
