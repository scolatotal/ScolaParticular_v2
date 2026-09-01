import { entities, type Field, type Value } from './entities';

const visibleFields = [
  'title',
  'description',
  'starts_on',
  'start_time',
  'end_time',
  'type',
];

export const newEventFields: Field[] = entities.calendar_events.fields
  .filter((field) => visibleFields.includes(field.name))
  .map((field) =>
    field.name === 'starts_on' ? { ...field, label: 'Data do evento' } : field,
  );

export function prepareNewEvent(
  values: Record<string, Value>,
): Record<string, Value> {
  const startTime = String(values.start_time ?? '').trim();
  const endTime = String(values.end_time ?? '').trim();
  return {
    ...values,
    ends_on: values.starts_on,
    start_time: startTime,
    end_time: endTime,
    all_day: !startTime && !endTime,
    group_id: '',
    student_id: '',
    location: '',
    notes: '',
    recurrence: 'Non se repite',
    repeat_until: '',
    reminder: 'Sen aviso',
  };
}
