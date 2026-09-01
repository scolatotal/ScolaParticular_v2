import { expect, test } from '@playwright/test';
import { agendaForDay, classesForDay, schoolCalendarForDay, calendarForDay } from '../lib/dates';
import { emptyDataset } from '../lib/entities';

// Pure data tests: no browser, credentials or database records are used.
function timetable() {
  const data = emptyDataset();
  data.groups = [{ id: 'group', name: '5º Primaria', archived: false }];
  data.subjects = [
    { id: 'maths', name: 'Matemáticas' },
    { id: 'language', name: 'Lingua Galega' },
  ];
  const session = {
    academic_year: '2026/27',
    group_id: 'group',
    subject_id: 'maths',
    room: 'Aula 12',
    start_time: '09:00:00',
    end_time: '10:00:00',
  };
  data.teacher_schedules = [
    { ...session, id: 'monday-late', weekday: 1, subject_id: 'language', start_time: '11:00:00', end_time: '12:00:00' },
    { ...session, id: 'monday-early', weekday: 1 },
    ...[2, 3, 4, 5].map(weekday => ({ ...session, id: `weekday-${weekday}`, weekday })),
    { ...session, id: 'previous-year', weekday: 1, academic_year: '2025/26' },
  ];
  data.school_calendar_events = [
    { id: 'start', name: 'Inicio das actividades lectivas', starts_on: '2026-09-09', ends_on: '2026-09-09', academic_year: '2026/27' },
    { id: 'end', name: 'Fin das actividades lectivas', starts_on: '2027-06-21', ends_on: '2027-06-21', academic_year: '2026/27' },
  ];
  return data;
}

test('Monday shows its registered subjects before the teaching year starts', () => {
  const data = timetable();
  const classes = classesForDay(data, '2026-08-31');
  expect(classes.map(item => [item.title, item.time, item.endTime])).toEqual([
    ['Matemáticas', '09:00:00', '10:00:00'],
    ['Lingua Galega', '11:00:00', '12:00:00'],
  ]);
  expect(classes[0].row.group_id).toBe('group');
  expect(classes[0].location).toBe('Aula 12');
  expect(classes[0].table).toBe('teacher_schedules');
  expect(data.teacher_schedules[0].id).toBe('monday-late');
  expect(agendaForDay(data, '2026-08-31').filter(item => item.kind === 'Clase')).toEqual([]);
});

test('each weekday selects its own timetable and weekends are empty', () => {
  const data = timetable();
  for (const [date, id] of [
    ['2026-09-01', 'weekday-2'],
    ['2026-09-02', 'weekday-3'],
    ['2026-09-03', 'weekday-4'],
    ['2026-09-04', 'weekday-5'],
  ]) {
    expect(classesForDay(data, date).map(item => item.row.id)).toEqual([id]);
  }
  expect(classesForDay(data, '2026-09-05')).toEqual([]);
  expect(classesForDay(data, '2026-09-06')).toEqual([]);
});

test('the current academic year and personal timetable stay separate', () => {
  const data = timetable();
  data.group_schedules = [{ ...data.teacher_schedules[1], id: 'group-only' }];
  expect(classesForDay(data, '2026-08-31', '2025/26').map(item => item.row.id)).toEqual(['previous-year']);
  expect(classesForDay(data, '2026-08-31', '2026/27').map(item => item.row.id)).toEqual(['monday-early', 'monday-late']);
  expect(classesForDay(data, '2026-08-31', '2027/28')).toEqual([]);
});

test('holidays suppress agenda classes without hiding the dashboard timetable', () => {
  const data = timetable();
  data.calendar_events = [{ id: 'holiday', type: 'Non lectivo', starts_on: '2026-09-14', ends_on: '2026-09-14' }];
  expect(classesForDay(data, '2026-09-14')).toHaveLength(2);
  expect(agendaForDay(data, '2026-09-14').filter(item => item.kind === 'Clase')).toEqual([]);
  expect(agendaForDay(data, '2026-09-21').filter(item => item.kind === 'Clase')).toEqual(classesForDay(data, '2026-09-21'));
});

test('saved edits and deletions are reflected without keeping a second copy', () => {
  const data = timetable();
  data.teacher_schedules = [{ ...data.teacher_schedules[1] }];
  expect(classesForDay(data, '2026-08-31')[0].title).toBe('Matemáticas');
  data.teacher_schedules[0].subject_id = 'language';
  expect(classesForDay(data, '2026-08-31')[0].title).toBe('Lingua Galega');
  data.teacher_schedules[0].weekday = 2;
  expect(classesForDay(data, '2026-08-31')).toEqual([]);
  expect(classesForDay(data, '2026-09-01')).toHaveLength(1);
  data.teacher_schedules = [];
  expect(classesForDay(data, '2026-09-01')).toEqual([]);
});

test('archived groups keep the existing agenda rule without changing timetable mirroring', () => {
  const data = timetable();
  data.groups[0].archived = true;
  expect(classesForDay(data, '2026-09-21')).toHaveLength(2);
  expect(agendaForDay(data, '2026-09-21').filter(item => item.kind === 'Clase')).toEqual([]);
});

test('the school calendar shows only official dates, without lessons or personal events', () => {
  const data = timetable();
  data.calendar_events = [{ id: 'personal', title: 'Conmemoración persoal', type: 'Conmemoración', starts_on: '2026-09-09', ends_on: '2026-09-09' }];
  data.meetings = [{ id: 'meeting', title: 'Reunión', date: '2026-09-09', status: 'Programada', show_in_agenda: true }];
  data.tutoring_sessions = [{ id: 'tutoring', date: '2026-09-09', status: 'Programada' }];
  data.school_commemorations = [{ id: 'official', name: 'Conmemoración oficial', starts_on: '2026-09-09', ends_on: '2026-09-09', academic_year: '2026/27' }];
  const before = structuredClone(data);
  const items = schoolCalendarForDay(data, '2026-09-09');
  expect(items.map(item => [item.table, item.row.id, item.kind])).toEqual([
    ['school_calendar_events', 'start', 'Calendario escolar'],
    ['school_commemorations', 'official', 'Conmemoración'],
  ]);
  expect(items.every(item => item.readonly && !item.time && !item.endTime)).toBe(true);
  expect(classesForDay(data, '2026-09-09')).toHaveLength(1);
  expect(data).toEqual(before);
});

test('official holiday ranges include both boundaries and respect the academic year', () => {
  const data = timetable();
  data.school_calendar_events.push({ id: 'holidays', name: 'Vacacións', starts_on: '2026-12-22', ends_on: '2027-01-07', is_non_teaching: true, academic_year: '2026/27' });
  for (const day of ['2026-12-22', '2026-12-25', '2027-01-07']) {
    expect(schoolCalendarForDay(data, day).map(item => [item.row.id, item.kind])).toEqual([['holidays', 'Non lectivo']]);
  }
  expect(schoolCalendarForDay(data, '2026-12-21')).toEqual([]);
  expect(schoolCalendarForDay(data, '2027-01-08')).toEqual([]);
  expect(schoolCalendarForDay(data, '2026-12-25', '2025/26')).toEqual([]);
});

test('a regular school day stays empty in the calendar while the dashboard retains its timetable', () => {
  const data = timetable();
  expect(schoolCalendarForDay(data, '2026-09-21')).toEqual([]);
  expect(classesForDay(data, '2026-09-21')).toHaveLength(2);
});

test('created events appear alongside official dates without importing timetable sessions or meetings', () => {
  const data = timetable();
  data.calendar_events = [{ id: 'created-event', title: 'Visita ao museo', type: 'Actividade', starts_on: '2026-09-09', ends_on: '2026-09-09', all_day: true }];
  data.meetings = [{ id: 'meeting', date: '2026-09-09', status: 'Programada', show_in_agenda: true }];
  data.tutoring_sessions = [{ id: 'tutor', date: '2026-09-09', status: 'Programada' }];
  const entries = calendarForDay(data, '2026-09-09');
  expect(entries.map(item => item.id)).toEqual(['school_calendar_events-start', 'calendar_events-created-event']);
  expect(entries.find(item => item.table === 'calendar_events')?.readonly).not.toBe(true);
  expect(calendarForDay(data, '2026-09-10')).toEqual([]);
  expect(classesForDay(data, '2026-09-09')).toHaveLength(1);
});
