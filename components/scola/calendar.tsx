'use client';

import { useState } from 'react';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  Plus,
  Rows3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  calendarForDay,
  dateLabel,
  today,
  weekdays,
  type AgendaItem,
} from '@/lib/dates';
import { useApp } from './provider';
import { Empty } from './shared';
import { Modal, RecordDetails } from './editor';

type CalendarMode = 'Semanal' | 'Mensual' | 'Día' | 'Lista';
const modes = [
  { name: 'Semanal', icon: Rows3 },
  { name: 'Mensual', icon: CalendarDays },
  { name: 'Día', icon: Clock },
  { name: 'Lista', icon: List },
] as const;
const categories = [
  'Calendario escolar',
  'Conmemoración',
  'Non lectivo',
  'Eventos propios',
];
const dayKey = (date: Date) => format(date, 'yyyy-MM-dd');
const tone = (item: AgendaItem) =>
  item.kind === 'Conmemoración'
    ? 'commem'
    : item.kind === 'Non lectivo'
      ? 'holiday'
      : 'personal';

function CalendarEvent({
  item,
  onOpen,
  compact = false,
}: {
  item: AgendaItem;
  onOpen: (item: AgendaItem) => void;
  compact?: boolean;
}) {
  return (
    <button
      className={`cal-event cal-${tone(item)} ${compact ? 'cal-event-compact' : ''}`}
      onClick={() => onOpen(item)}
      aria-label={`${item.title}, ${item.kind}`}
    >
      {compact ? (
        <>
          <span className="cal-event-dot" />
          <span className="cal-event-name">{item.title}</span>
        </>
      ) : (
        <>
          <span className="cal-event-type">{item.kind}</span>
          <strong>{item.title}</strong>
        </>
      )}
    </button>
  );
}

function CalendarDayEvents({
  items,
  onOpen,
}: {
  items: AgendaItem[];
  onOpen: (item: AgendaItem) => void;
}) {
  return items.length ? (
    <div className="agenda-list">
      {items.map((item) => (
        <CalendarEvent key={item.id} item={item} onOpen={onOpen} />
      ))}
    </div>
  ) : (
    <Empty
      title="Non hai datas sinaladas neste día"
      description="Aquí aparecerán as datas do calendario escolar e os eventos que crees."
    />
  );
}

export function CalendarView() {
  const { data, edit } = useApp();
  const [date, setDate] = useState(today),
    [view, setView] = useState<CalendarMode>('Semanal'),
    [category, setCategory] = useState('');
  const [weekends, setWeekends] = useState(false),
    [opened, setOpened] = useState<AgendaItem | null>(null),
    [selectedDay, setSelectedDay] = useState<string | null>(null);
  const currentDay = today(),
    selected = parseISO(date),
    year = String(data.profiles[0]?.academic_year || '2026/27');
  const weekStart = startOfWeek(selected, { weekStartsOn: 1 });
  const firstDay =
    view === 'Semanal'
      ? weekStart
      : view === 'Día'
        ? selected
        : startOfWeek(startOfMonth(selected), { weekStartsOn: 1 });
  const lastDay =
    view === 'Semanal'
      ? addDays(weekStart, 6)
      : view === 'Día'
        ? selected
        : endOfWeek(endOfMonth(selected), { weekStartsOn: 1 });
  const dates = eachDayOfInterval({ start: firstDay, end: lastDay });
  const eventsForDay = (key: string) =>
    calendarForDay(data, key, year).filter(
      (item) =>
        !category ||
        item.kind === category ||
        (category === 'Eventos propios' && item.table === 'calendar_events'),
    );
  const events = new Map(
    dates.map((day) => {
      const key = dayKey(day);
      return [key, eventsForDay(key)] as const;
    }),
  );
  const monthDays = dates.filter((day) => isSameMonth(day, selected));
  const eventDays = monthDays.filter((day) => events.get(dayKey(day))!.length);
  const monthCount = eventDays.reduce(
    (count, day) => count + events.get(dayKey(day))!.length,
    0,
  );
  const weekDays = weekends ? dates : dates.slice(0, 5);
  const weekendCount = dates
    .slice(5, 7)
    .reduce((count, day) => count + (events.get(dayKey(day))?.length || 0), 0);
  const weeklyEnd = addDays(weekStart, weekends ? 6 : 4);
  const weekHeading = isSameMonth(weekStart, weeklyEnd)
    ? `Semana do ${dateLabel(dayKey(weekStart), 'd')} ao ${dateLabel(dayKey(weeklyEnd), 'd MMMM')}`
    : `Semana do ${dateLabel(dayKey(weekStart), 'd MMM')} ao ${dateLabel(dayKey(weeklyEnd), 'd MMM')}`;
  const heading =
    view === 'Semanal'
      ? weekHeading
      : view === 'Día'
        ? dateLabel(date, "EEEE, d 'de' MMMM")
        : dateLabel(date, 'MMMM yyyy');
  function navigate(direction: number) {
    setDate(
      dayKey(
        view === 'Mensual' || view === 'Lista'
          ? addMonths(selected, direction)
          : addDays(selected, direction * (view === 'Semanal' ? 7 : 1)),
      ),
    );
  }
  const showDay = (day: string) => {
    setSelectedDay(day);
  };

  return (
    <div className="scola-agenda">
      <header className="cal-page-header">
        <div className="cal-page-title">
          <span>
            <CalendarDays size={23} />
          </span>
          <h1>Axenda</h1>
        </div>
        <Button
          className="primary cal-create"
          onClick={() => {
            setCategory('');
            if (selected.getDay() === 0 || selected.getDay() === 6)
              setWeekends(true);
            edit('calendar_events', undefined, {
              starts_on: date,
              ends_on: date,
              all_day: true,
            });
          }}
        >
          <Plus size={16} />
          Crear evento
        </Button>
      </header>
      <section
        className="cal-surface"
        aria-label="Calendario escolar e eventos propios"
      >
        <nav className="cal-view-tabs" aria-label="Vistas da axenda">
          {modes.map(({ name, icon: Icon }) => (
            <button
              key={name}
              aria-pressed={view === name}
              onClick={() => setView(name)}
              className={view === name ? 'active' : ''}
            >
              <Icon size={16} />
              {name}
            </button>
          ))}
        </nav>
        <div className="cal-main-layout">
          <div className="cal-main">
            <div className="cal-period-bar">
              <h2 aria-live="polite">{heading}</h2>
              <div className="cal-period-actions">
                <Button variant="ghost" onClick={() => setDate(currentDay)}>
                  Hoxe
                </Button>
                <Button
                  variant="outline"
                  aria-label="Período anterior"
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft size={19} />
                </Button>
                <Button
                  variant="outline"
                  aria-label="Período seguinte"
                  onClick={() => navigate(1)}
                >
                  <ChevronRight size={19} />
                </Button>
              </div>
            </div>
            <div className="cal-filters">
              <label className="cal-filter-label">
                <span className="sr-only">Filtrar datas por tipo</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Todas as datas</option>
                  {categories.map((kind) => (
                    <option key={kind}>{kind}</option>
                  ))}
                </select>
              </label>
              {view === 'Semanal' && (
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={weekends}
                    onChange={(e) => setWeekends(e.target.checked)}
                  />
                  Fin de semana
                  {weekendCount > 0 && (
                    <span className="cal-count">{weekendCount}</span>
                  )}
                </label>
              )}
              <div className="cal-legend">
                <span>
                  <i />
                  Datas importantes
                </span>
                <span>
                  <i className="commem" />
                  Conmemoración
                </span>
                <span>
                  <i className="holiday" />
                  Non lectivo
                </span>
              </div>
            </div>

            {view === 'Semanal' && (
              <div className={`cal-week ${weekends ? 'cal-week-seven' : ''}`}>
                {weekDays.map((day) => {
                  const key = dayKey(day),
                    list = events.get(key)!;
                  return (
                    <section
                      key={key}
                      className={`cal-week-day ${key === currentDay ? 'cal-today' : ''}`}
                      aria-label={dateLabel(key, 'EEEE, d MMMM')}
                    >
                      <button
                        className="cal-week-day-header"
                        onClick={() => showDay(key)}
                        aria-label={`Ver ${dateLabel(key, 'EEEE, d MMMM')}`}
                      >
                        <span>{dateLabel(key, 'EEEE')}</span>
                        <strong>{day.getDate()}</strong>
                        {key === currentDay && <small>Hoxe</small>}
                      </button>
                      <div
                        className={`cal-week-events ${list.length ? '' : 'cal-week-empty'}`}
                      >
                        {list.length ? (
                          list.map((item) => (
                            <CalendarEvent
                              item={item}
                              key={item.id}
                              onOpen={setOpened}
                            />
                          ))
                        ) : (
                          <span className="cal-free">Sen datas sinaladas</span>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}

            {view === 'Mensual' && (
              <div className="cal-month">
                <div className="cal-month-head">
                  {weekdays.map((day) => (
                    <div key={day}>
                      <span className="cal-weekday-full">{day}</span>
                      <span className="cal-weekday-short" aria-hidden="true">
                        {day.slice(0, 3)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="cal-month-grid">
                  {dates.map((day) => {
                    const key = dayKey(day),
                      list = events.get(key)!;
                    return (
                      <div
                        key={key}
                        className={`cal-month-cell ${!isSameMonth(day, selected) ? 'cal-outside' : ''} ${key === currentDay ? 'cal-today' : ''}`}
                      >
                        <button
                          onClick={() => showDay(key)}
                          className="cal-date-button"
                          aria-current={key === currentDay ? 'date' : undefined}
                          aria-label={`${dateLabel(key, 'd MMMM')}, ${list.length} datas sinaladas`}
                        >
                          {day.getDate()}
                        </button>
                        <div className="cal-month-events">
                          {list.slice(0, 2).map((item) => (
                            <CalendarEvent
                              key={item.id}
                              item={item}
                              compact
                              onOpen={setOpened}
                            />
                          ))}
                          {list.length > 2 && (
                            <button
                              className="cal-more"
                              onClick={() => showDay(key)}
                            >
                              +{list.length - 2} máis
                            </button>
                          )}
                        </div>
                        <div className="cal-month-dots" aria-hidden="true">
                          {list.slice(0, 3).map((item) => (
                            <i className={`cal-${tone(item)}`} key={item.id} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === 'Día' && (
              <div className="cal-single-day">
                <CalendarDayEvents
                  items={events.get(date) || []}
                  onOpen={setOpened}
                />
              </div>
            )}
            {view === 'Lista' &&
              (eventDays.length ? (
                <div className="cal-list-view">
                  {eventDays.map((day) => {
                    const key = dayKey(day);
                    return (
                      <section key={key}>
                        <h3>{dateLabel(key, 'EEEE, d MMMM')}</h3>
                        <CalendarDayEvents
                          items={events.get(key)!}
                          onOpen={setOpened}
                        />
                      </section>
                    );
                  })}
                </div>
              ) : (
                <Empty
                  title="Non hai datas sinaladas neste mes"
                  description="Crea un evento ou proba con outro tipo ou período do calendario."
                />
              ))}
          </div>
          {view === 'Mensual' && (
            <aside className="cal-month-sidebar">
              <h3>
                <i />
                Datas do mes<span>{monthCount}</span>
              </h3>
              {eventDays.length ? (
                <div className="cal-month-event-list">
                  {eventDays.map((day) => {
                    const key = dayKey(day);
                    return (
                      <section key={key}>
                        <h4>{dateLabel(key, 'd MMMM')}</h4>
                        {events.get(key)!.map((item) => (
                          <CalendarEvent
                            key={item.id}
                            item={item}
                            onOpen={setOpened}
                          />
                        ))}
                      </section>
                    );
                  })}
                </div>
              ) : (
                <div className="cal-sidebar-empty">
                  <CalendarDays size={27} />
                  <p>Non hai datas sinaladas neste mes.</p>
                </div>
              )}
            </aside>
          )}
        </div>
      </section>
      <p className="source-note cal-source">
        Calendario 2026/27:{' '}
        <a
          target="_blank"
          rel="noreferrer"
          href="https://www.xunta.gal/dog/Publicados/2026/20260615/AnuncioG0761-050626-0001_gl.html"
        >
          DOG do 15 de xuño de 2026
        </a>
        . As conmemoracións son orientativas e non marcan días non lectivos.
      </p>
      {selectedDay && (
        <Modal
          title={dateLabel(selectedDay, "EEEE, d 'de' MMMM")}
          description="Datas do calendario escolar e eventos propios deste día."
          onClose={() => setSelectedDay(null)}
        >
          <CalendarDayEvents
            items={eventsForDay(selectedDay)}
            onOpen={setOpened}
          />
        </Modal>
      )}
      {opened && (
        <RecordDetails
          table={opened.table}
          row={opened.row}
          onClose={() => setOpened(null)}
        />
      )}
    </div>
  );
}
