import { expect, test } from '@playwright/test';
import { prepareNewEvent } from '../lib/event-form';
import { entitySchema } from '../lib/validation';

const newEvent = {
  title: 'Visita ao museo',
  description: '',
  starts_on: '2026-09-15',
  start_time: '',
  end_time: '',
  type: 'Actividade',
};

test('one event date produces a valid single-day event without hidden required inputs', () => {
  const result = entitySchema('calendar_events').safeParse(
    prepareNewEvent(newEvent),
  );
  expect(result.success).toBe(true);
  if (!result.success) return;
  expect(result.data.ends_on).toBe('2026-09-15');
  expect(result.data.all_day).toBe(true);
  expect(result.data.recurrence).toBe('Non se repite');
  expect(result.data.reminder).toBe('Sen aviso');
});

test('both hours create a timed event and reversed hours are rejected', () => {
  const values = prepareNewEvent({
    ...newEvent,
    start_time: '09:00',
    end_time: '10:30',
  });
  const schema = entitySchema('calendar_events');
  expect(schema.safeParse(values).success).toBe(true);
  expect(values.all_day).toBe(false);
  expect(schema.safeParse({ ...values, end_time: '08:30' }).success).toBe(
    false,
  );
});

test('an incomplete time range reports a visible field instead of requiring a removed checkbox', () => {
  for (const hours of [
    { start_time: '09:00', end_time: '' },
    { start_time: '', end_time: '10:30' },
  ]) {
    const result = entitySchema('calendar_events').safeParse(
      prepareNewEvent({ ...newEvent, ...hours }),
    );
    expect(result.success).toBe(false);
    if (!result.success)
      expect(
        result.error.issues.some((issue) => issue.path[0] === 'start_time'),
      ).toBe(true);
  }
});

test('changing the event date also changes its stored end date and removes obsolete recurrence defaults', () => {
  const values = prepareNewEvent({
    ...newEvent,
    starts_on: '2026-10-20',
    ends_on: '2026-09-15',
    recurrence: 'Semanal',
    repeat_until: '2026-12-31',
    reminder: '1 día antes',
  });
  expect(values.ends_on).toBe('2026-10-20');
  expect(values.recurrence).toBe('Non se repite');
  expect(values.repeat_until).toBe('');
  expect(values.reminder).toBe('Sen aviso');
  expect(entitySchema('calendar_events').safeParse(values).success).toBe(true);
});

test('existing multi-day and recurring events still validate without being shortened', () => {
  const existing = {
    ...prepareNewEvent(newEvent),
    ends_on: '2026-09-17',
    recurrence: 'Semanal',
    repeat_until: '2026-12-31',
    reminder: '1 día antes',
  };
  const result = entitySchema('calendar_events').safeParse(existing);
  expect(result.success).toBe(true);
  if (!result.success) return;
  expect(result.data.ends_on).toBe('2026-09-17');
  expect(result.data.recurrence).toBe('Semanal');
  expect(result.data.reminder).toBe('1 día antes');
});
