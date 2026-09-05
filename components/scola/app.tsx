'use client';
import { Fragment, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from './provider';
import { Auth } from './auth';
import { Shell } from './shell';
import { Dashboard } from './dashboard';
import { Students, StudentDetail } from './students';
import { CalendarView } from './calendar';
import { Attendance } from './attendance';
import { Schedules } from './schedules';
import { Diary } from './diary';
import { Tasks } from './tasks';
import { School, Settings } from './settings';
import { PageHeading, Collection } from './shared';
import { AppLink as Link, SCOLA_NAVIGATION_EVENT } from './app-link';

function browserLocation(route: string, id?: string) {
  if (typeof window === 'undefined')
    return { route, id, key: `/${route}${id ? `/${id}` : ''}` };
  const [nextRoute = 'login', nextId] = window.location.pathname
    .split('/')
    .filter(Boolean);
  return {
    route: nextRoute,
    id: nextId,
    key: `${window.location.pathname}${window.location.search}`,
  };
}

export function ScolaApp({
  route = 'login',
  id,
}: {
  route?: string;
  id?: string;
}) {
  const [location, setLocation] = useState(() => browserLocation(route, id));
  const { user, authReady, loading, error, reload, edit } = useApp();
  const activeRoute = location.route;
  const activeId = location.id;
  const publicRoute = [
    'login',
    'register',
    'forgot-password',
    'reset-password',
  ].includes(activeRoute);
  useEffect(() => {
    const syncLocation = () => setLocation(browserLocation(route, id));
    window.addEventListener('popstate', syncLocation);
    window.addEventListener(SCOLA_NAVIGATION_EVENT, syncLocation);
    return () => {
      window.removeEventListener('popstate', syncLocation);
      window.removeEventListener(SCOLA_NAVIGATION_EVENT, syncLocation);
    };
  }, [route, id]);
  useEffect(() => {
    if (authReady && !user && !publicRoute && !error)
      window.location.replace('/login');
  }, [authReady, user, publicRoute, error]);
  if (publicRoute) return <Auth mode={activeRoute} />;
  if (!authReady || !user)
    return (
      <output className="page-loading">
        {error || 'Comprobando o teu acceso…'}
        {error && <Link href="/login">Volver ao inicio</Link>}
      </output>
    );
  return (
    <Shell route={activeRoute}>
      <Fragment key={location.key}>
      {error ? (
        <div className="error-box" role="alert">
          {error}
          <Button variant="outline" onClick={() => void reload()}>
            Volver intentalo
          </Button>
        </div>
      ) : loading ? (
        <output
          className="loading-skeleton"
          aria-label="Cargando o teu espazo"
        >
          <div />
          <div />
          <div />
          <span>Cargando o teu espazo…</span>
        </output>
      ) : activeRoute === 'dashboard' ? (
        <Dashboard />
      ) : activeRoute === 'alumnado' ? (
        activeId ? (
          <StudentDetail id={activeId} />
        ) : (
          <Students />
        )
      ) : activeRoute === 'axenda' ? (
        <CalendarView />
      ) : activeRoute === 'faltas' ? (
        <Attendance />
      ) : activeRoute === 'horarios' ? (
        <Schedules />
      ) : activeRoute === 'diario' ? (
        <Diary />
      ) : activeRoute === 'centro' ? (
        <School />
      ) : activeRoute === 'configuracion' ? (
        <Settings />
      ) : activeRoute === 'titorias' ? (
        <>
          <PageHeading
            eyebrow="CONVERSAS QUE ACOMPAÑAN"
            title="As miñas titorías"
            description="Un espazo para escoitar, acordar e facer seguimento."
            actions={
              <Button
                className="primary"
                onClick={() => edit('tutoring_sessions')}
              >
                <Plus size={17} />
                Crear titoría
              </Button>
            }
          />
          <Collection table="tutoring_sessions" hideCreate />
        </>
      ) : activeRoute === 'tarefas' ? (
        <Tasks />
      ) : null}
      </Fragment>
    </Shell>
  );
}
