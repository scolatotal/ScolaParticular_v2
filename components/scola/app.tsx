'use client';
import { useEffect } from 'react';
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
import { School, Settings } from './settings';
import { PageHeading, Collection } from './shared';
export function ScolaApp({
  route = 'login',
  id,
}: {
  route?: string;
  id?: string;
}) {
  const { user, authReady, loading, error, reload, edit } = useApp();
  const publicRoute = [
    'login',
    'register',
    'forgot-password',
    'reset-password',
  ].includes(route);
  useEffect(() => {
    if (authReady && !user && !publicRoute && !error)
      window.location.replace('/login');
  }, [authReady, user, publicRoute, error]);
  if (publicRoute) return <Auth mode={route} />;
  if (!authReady || !user)
    return (
      <div className="page-loading" role="status">
        {error || 'Comprobando o teu acceso…'}
        {error && <a href="/login">Volver ao inicio</a>}
      </div>
    );
  return (
    <Shell route={route}>
      {error ? (
        <div className="error-box" role="alert">
          {error}
          <Button variant="outline" onClick={() => void reload()}>
            Volver intentalo
          </Button>
        </div>
      ) : loading ? (
        <div
          className="loading-skeleton"
          role="status"
          aria-label="Cargando o teu espazo"
        >
          <div />
          <div />
          <div />
          <span>Cargando o teu espazo…</span>
        </div>
      ) : route === 'dashboard' ? (
        <Dashboard />
      ) : route === 'alumnado' ? (
        id ? (
          <StudentDetail id={id} />
        ) : (
          <Students />
        )
      ) : route === 'axenda' ? (
        <CalendarView />
      ) : route === 'faltas' ? (
        <Attendance />
      ) : route === 'horarios' ? (
        <Schedules />
      ) : route === 'diario' ? (
        <Diary />
      ) : route === 'centro' ? (
        <School />
      ) : route === 'configuracion' ? (
        <Settings />
      ) : route === 'titorias' ? (
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
      ) : route === 'reunions' ? (
        <>
          <PageHeading
            eyebrow="ACORDOS QUE NOS FAN AVANZAR"
            title="As miñas reunións"
            description="Prepara cada encontro e conserva os acordos e as tarefas."
            actions={
              <Button className="primary" onClick={() => edit('meetings')}>
                <Plus size={17} />
                Crear reunión
              </Button>
            }
          />
          <Collection table="meetings" hideCreate />
        </>
      ) : null}
    </Shell>
  );
}
