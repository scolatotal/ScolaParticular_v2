'use client';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Plus,
  Search,
  FileText,
  Pencil,
  ArrowUpRight,
  Clock,
  Users,
  ClipboardCheck,
  NotebookPen,
  MessagesSquare,
  GraduationCap,
  Building2,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  entities,
  rowTitle,
  textValue,
  type EntityName,
  type DataRow,
  type Value,
} from '@/lib/entities';
import { dateLabel } from '@/lib/dates';
import { useApp } from './provider';
import { RecordDetails, DeleteButton } from './editor';
const pageIcons = {
  alumnado: Users,
  faltas: ClipboardCheck,
  diario: NotebookPen,
  horarios: Clock,
  titorias: MessagesSquare,
  reunions: GraduationCap,
  centro: Building2,
  configuracion: Settings,
};
export function Empty({
  title = 'Aínda non hai rexistros',
  description = 'Engade o primeiro para comezar a organizar este espazo.',
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <FileText size={24} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  const section = usePathname()?.split('/')[1] as keyof typeof pageIcons;
  const HeadingIcon = pageIcons[section] || FileText;
  return (
    <div className="page-heading">
      <div className="page-heading-main">
        <span className="page-heading-icon">
          <HeadingIcon size={23} />
        </span>
        <div className="page-heading-copy">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      {actions}
    </div>
  );
}
export function Panel({
  title,
  link,
  children,
  icon,
  className = '',
}: {
  title: string;
  link?: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <h2>
          {icon}
          {title}
        </h2>
        {link && (
          <Link href={link}>
            Ver todo <ArrowUpRight size={14} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
export function Badge({
  children,
  tone = 'blue',
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function Collection({
  table,
  rows,
  defaults,
  title,
  compact = false,
  hideFilters = false,
  hideCreate = false,
}: {
  table: EntityName;
  rows?: DataRow[];
  defaults?: Record<string, Value>;
  title?: string;
  compact?: boolean;
  hideFilters?: boolean;
  hideCreate?: boolean;
}) {
  const { data, edit } = useApp();
  const [search, setSearch] = useState(''),
    [filter, setFilter] = useState(''),
    [group, setGroup] = useState(''),
    [date, setDate] = useState(''),
    [selected, setSelected] = useState<DataRow | null>(null);
  const entity = entities[table];
  const list = rows ?? data[table];
  const options =
    entity.fields.find((f) => f.name === 'status')?.options ??
    entity.fields.find((f) => f.name === 'type')?.options;
  const filtered = list
    .filter(
      (row) =>
        Object.values(row)
          .join(' ')
          .toLocaleLowerCase('gl')
          .includes(search.toLocaleLowerCase('gl')) &&
        (!filter || (row.status ?? row.type) === filter) &&
        (!group || row.group_id === group) &&
        (!date || (row.date ?? row.starts_on) === date),
    )
    .sort(
      (a, b) =>
        textValue(b, 'date').localeCompare(textValue(a, 'date')) ||
        textValue(b, 'created_at').localeCompare(textValue(a, 'created_at')),
    );
  return (
    <section className={compact ? 'related-section' : 'collection-panel'}>
      {(title || (!entity.readonly && !hideCreate)) && (
        <div className="collection-top">
          {title && <h2>{title}</h2>}
          {!entity.readonly && !hideCreate && (
            <Button
              className="primary"
              onClick={() => edit(table, undefined, defaults)}
            >
              <Plus size={17} />
              {compact
                ? 'Engadir'
                : `Crear ${entity.singular.toLocaleLowerCase('gl')}`}
            </Button>
          )}
        </div>
      )}
      {!hideFilters && (
        <div className="filter-bar">
          <div className="search-field">
            <Search size={17} />
            <Input
              placeholder="Buscar neste espazo…"
              aria-label={`Buscar en ${entity.label}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {options && (
            <select
              aria-label="Filtrar por tipo ou estado"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">Todos os tipos / estados</option>
              {options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          )}
          {entity.fields.some((f) => f.name === 'group_id') && (
            <select
              aria-label="Filtrar por grupo"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            >
              <option value="">Todos os grupos</option>
              {data.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
          {entity.fields.some((f) =>
            ['date', 'starts_on'].includes(f.name),
          ) && (
            <input
              aria-label="Filtrar por data"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          )}
        </div>
      )}
      {filtered.length ? (
        <div className={compact ? 'record-list' : 'record-grid'}>
          {filtered.map((row) => (
            <article className="record-card" key={row.id}>
              <div className="record-card-top">
                <Badge
                  tone={
                    row.status === 'Cancelada'
                      ? 'gray'
                      : row.severity === 'Alta'
                        ? 'red'
                        : 'blue'
                  }
                >
                  {textValue(row, 'status') ||
                    textValue(row, 'type') ||
                    textValue(row, 'severity') ||
                    entity.singular}
                </Badge>
                <div className="record-actions">
                  {!entity.readonly && (
                    <>
                      <Button
                        variant="ghost"
                        aria-label="Editar rexistro"
                        onClick={() => edit(table, row)}
                      >
                        <Pencil size={15} />
                      </Button>
                      <DeleteButton table={table} row={row} />
                    </>
                  )}
                </div>
              </div>
              <button className="record-title" onClick={() => setSelected(row)}>
                {rowTitle(table, row, data)}
              </button>
              {(row.date || row.starts_on) && (
                <p className="record-meta">
                  <Clock size={14} />
                  {dateLabel(
                    textValue(row, 'date') || textValue(row, 'starts_on'),
                  )}
                  {row.start_time && ` · ${String(row.start_time).slice(0, 5)}`}
                </p>
              )}
              {row.student_id && (
                <p className="record-meta">
                  {data.students.find((s) => s.id === row.student_id)
                    ? rowTitle(
                        'students',
                        data.students.find((s) => s.id === row.student_id)!,
                        data,
                      )
                    : ''}
                </p>
              )}
              {row.group_id && (
                <p className="record-meta">
                  {data.groups.find((g) => g.id === row.group_id)?.name}
                </p>
              )}
              <p className="record-excerpt">
                {textValue(row, 'content') ||
                  textValue(row, 'description') ||
                  textValue(row, 'notes') ||
                  textValue(row, 'topics') ||
                  textValue(row, 'agenda')}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title={
            search || filter || date
              ? 'Non hai resultados'
              : 'Aínda non hai rexistros'
          }
          description={
            search || filter || date
              ? 'Proba con outros filtros.'
              : 'Crea o primeiro rexistro deste espazo.'
          }
        />
      )}{' '}
      {selected && (
        <RecordDetails
          table={table}
          row={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
