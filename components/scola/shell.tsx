'use client';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Home,
  CalendarDays,
  Users,
  ClipboardCheck,
  NotebookPen,
  Clock,
  MessagesSquare,
  Building2,
  Settings,
  Search,
  Menu,
  LogOut,
  MoreHorizontal,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type EntityName, rowTitle, textValue } from '@/lib/entities';
import { useApp } from './provider';
import { Brand } from './auth';
import { EditorHost, Modal, RecordDetails } from './editor';
import { AppLink as Link } from './app-link';
const nav = [
  ['dashboard', 'Inicio', Home],
  ['axenda', 'Axenda', CalendarDays],
  ['alumnado', 'Alumnado', Users],
  ['faltas', 'Faltas de asistencia', ClipboardCheck],
  ['diario', 'Diario docente', NotebookPen],
  ['horarios', 'Horarios', Clock],
  ['titorias', 'Titorías', MessagesSquare],
  ['reunions', 'Reunións', GraduationCap],
  ['centro', 'Datos do centro', Building2],
] as const;
export function Shell({
  route,
  children,
}: {
  route: string;
  children: ReactNode;
}) {
  const { data, signOut } = useApp();
  const [more, setMore] = useState(false),
    [searchOpen, setSearchOpen] = useState(false);
  const profile = data.profiles[0];
  const name = textValue(profile, 'display_name') || 'Docente';
  const school =
    data.schools.find((s) => s.id === profile?.school_id) ?? data.schools[0];
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  const links = (
    <>
      {nav.map(([path, label, Icon]) => (
        <Link
          key={path}
          href={`/${path}`}
          className={`nav-link ${route === path ? 'active' : ''}`}
          aria-current={route === path ? 'page' : undefined}
          onClick={() => setMore(false)}
        >
          <Icon size={19} />
          <span>{label}</span>
          {route === path && (
            <ChevronRight size={15} className="nav-active-arrow" />
          )}
        </Link>
      ))}
    </>
  );
  return (
    <div
      data-section={route}
      className={`app-shell ${route === 'dashboard' ? 'dashboard-shell' : ''} ${route === 'axenda' ? 'agenda-shell' : ''}`}
    >
      <a className="skip-link" href="#main">
        Saltar ao contido
      </a>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Brand />
        </div>
        <div className="profile-block">
          <div className="avatar">{name.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{name}</strong>
            <p>{school?.name || 'O teu espazo docente'}</p>
          </div>
        </div>
        <Link href="/configuracion" className="edit-profile-link">
          <Settings size={16} />
          Editar perfil
        </Link>
        <button className="sidebar-search" onClick={() => setSearchOpen(true)}>
          <Search size={16} />
          <span>Buscar en Scola…</span>
          <kbd>Ctrl K</kbd>
        </button>
        <nav aria-label="Navegación principal">{links}</nav>
        <div className="sidebar-footer">
          <Button variant="ghost" onClick={() => void signOut()}>
            <LogOut size={17} />
            Pechar sesión
          </Button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="mobile-brand">
            <Button
              variant="ghost"
              aria-label="Abrir menú"
              onClick={() => setMore(true)}
            >
              <Menu />
            </Button>
            <Brand />
          </div>
          <div className="breadcrumb">
            O meu espazo <ChevronRight size={14} />{' '}
            <strong>
              {route === 'configuracion'
                ? 'Editar perfil'
                : nav.find((n) => n[0] === route)?.[1] || 'Ficha do alumnado'}
            </strong>
          </div>
          <button
            className="global-search"
            aria-label="Buscar en Scola"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={17} />
            <span>Buscar en Scola…</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div className="topbar-right">
            <span className="year-pill">
              Curso {profile?.academic_year || '2026/27'}
            </span>
            <Link
              href="/configuracion"
              className="avatar avatar-small"
              aria-label="Abrir o meu perfil"
            >
              {name.slice(0, 1).toUpperCase()}
            </Link>
          </div>
        </header>
        <main id="main" className="main-content">
          {children}
        </main>
        <footer className="workspace-footer">
          <span>Scola · A túa axenda docente</span>
          <span>Un pouco de orde. Máis tempo para ensinar.</span>
        </footer>
      </div>
      <nav className="bottom-nav" aria-label="Navegación móbil">
        {nav.slice(0, 4).map(([path, label, Icon]) => (
          <Link
            href={`/${path}`}
            key={path}
            className={route === path ? 'active' : ''}
          >
            <Icon size={21} />
            <span>{path === 'faltas' ? 'Faltas' : label}</span>
          </Link>
        ))}
        <button onClick={() => setMore(true)}>
          <MoreHorizontal size={21} />
          <span>Máis</span>
        </button>
      </nav>
      {more && (
        <Modal title="O meu espazo" onClose={() => setMore(false)}>
          <nav className="mobile-menu">
            {links}
            <Link
              href="/configuracion"
              className="nav-link"
              onClick={() => setMore(false)}
            >
              <Settings size={19} />
              <span>Editar perfil</span>
            </Link>
            <Button variant="ghost" onClick={() => void signOut()}>
              <LogOut />
              Pechar sesión
            </Button>
          </nav>
        </Modal>
      )}
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      <EditorHost />
    </div>
  );
}
function GlobalSearch({ onClose }: { onClose: () => void }) {
  const { data } = useApp();
  const [query, setQuery] = useState(''),
    [selected, setSelected] = useState<{
      table: EntityName;
      id: string;
    } | null>(null);
  const tables: EntityName[] = [
    'students',
    'diary_entries',
    'meetings',
    'tutoring_sessions',
    'calendar_events',
  ];
  const results =
    query.trim().length > 1
      ? tables.flatMap((table) =>
          data[table]
            .filter((row) =>
              Object.values(row)
                .join(' ')
                .toLocaleLowerCase('gl')
                .includes(query.toLocaleLowerCase('gl')),
            )
            .map((row) => ({ table, row })),
        )
      : [];
  return (
    <Modal
      title="Buscar en Scola"
      description="Alumnado, diario, titorías, reunións e eventos."
      onClose={onClose}
    >
      <div className="search-field">
        <Search size={18} />
        <Input
          placeholder="Escribe polo menos dúas letras…"
          aria-label="Busca global"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="search-results">
        {results.slice(0, 40).map(({ table, row }) =>
          table === 'students' ? (
            <Link href={`/alumnado/${row.id}`} key={row.id} onClick={onClose}>
              <Users size={17} />
              {rowTitle(table, row, data)}
            </Link>
          ) : (
            <button
              key={row.id}
              onClick={() => setSelected({ table, id: row.id })}
            >
              <Search size={17} />
              {rowTitle(table, row, data)}
            </button>
          ),
        )}
        {query.length > 1 && !results.length && <p>Non atopamos resultados.</p>}
      </div>
      {selected && (
        <RecordDetails
          table={selected.table}
          row={data[selected.table].find((r) => r.id === selected.id)!}
          onClose={() => setSelected(null)}
        />
      )}
    </Modal>
  );
}
