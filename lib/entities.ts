import config from './entity-config.json' with { type: 'json' };
export type EntityName = keyof typeof config;
export type Value = string | number | boolean | null;
export type DataRow = { id: string; user_id?: string; created_at?: string; updated_at?: string; [key: string]: Value | undefined };
export type Field = { name: string; label: string; kind: string; required?: boolean; default?: Value; options?: string[]; ref?: EntityName; bucket?: string };
export type Entity = { label: string; singular: string; titleField: string; fields: Field[]; readonly?: boolean };
export const entities = config as Record<EntityName, Entity>;
export const entityNames = Object.keys(entities) as EntityName[];
export type Dataset = Record<EntityName, DataRow[]>;
export const emptyDataset = (): Dataset => Object.fromEntries(entityNames.map(name=>[name,[]])) as unknown as Dataset;
export const textValue = (row: DataRow | undefined, key: string): string => String(row?.[key] ?? '');
export function rowTitle(table: EntityName, row: DataRow, data?: Dataset): string {
 if (table === 'students') return `${row.first_name} ${row.last_name}`;
 const field = entities[table].fields.find(f=>f.name === entities[table].titleField);
 const value = textValue(row, entities[table].titleField);
 if (field?.ref && data) { const target = data[field.ref].find(r=>r.id===value); return target ? rowTitle(field.ref,target,data) : 'Sen asignar'; }
 return value || entities[table].singular;
}
