'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { useApp } from './provider';
import { PageHeading, Panel } from './shared';
import { EntityForm } from './editor';
export function School() {
  const { data } = useApp();
  const school =
    data.schools.find((s) => s.id === data.profiles[0]?.school_id) ??
    data.schools[0];
  return (
    <>
      <PageHeading
        eyebrow="O LUGAR ONDE ENSINAS"
        title="Datos do centro"
        description="A información que precisas ter sempre a man."
      />
      <section className="panel settings-panel">
        <EntityForm key={school?.id || 'new'} table="schools" row={school} />
      </section>
    </>
  );
}
export function Settings() {
  const { data } = useApp();
  const [tab, setTab] = useState('O meu perfil');
  return (
    <>
      <PageHeading
        title="Configuración"
        description="Adapta Scola ao teu curso e á túa maneira de traballar."
      />
      <div className="tabs">
        {['O meu perfil', 'Privacidade'].map((t) => (
          <button
            key={t}
            className={t === tab ? 'active' : ''}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'O meu perfil' && (
        <section className="panel settings-panel">
          <EntityForm
            key={data.profiles[0]?.id}
            table="profiles"
            row={data.profiles[0]}
          />
        </section>
      )}
      {tab === 'Privacidade' && (
        <Panel title="Un espazo persoal e privado">
          <div className="privacy-content">
            <ShieldCheck size={32} />
            <h3>Ti decides que necesitas gardar.</h3>
            <p>
              Os rexistros están asociados á túa conta e protexidos por
              políticas de acceso en Supabase. As fotografías e os adxuntos
              gárdanse en espazos privados e descárganse coa túa sesión.
            </p>
            <p>
              Non introduzas datos reais de menores ata contar coa autorización
              e coas condicións de tratamento aprobadas polo teu centro. A
              seguridade técnica non substitúe esas obrigas.
            </p>
            <p>
              Podes editar e eliminar os teus rexistros desde cada sección. A
              eliminación dunha conta completa debe xestionarse coa persoa
              administradora de Supabase, incluídos os ficheiros e as copias de
              seguridade.
            </p>
            <Link href="/forgot-password">Cambiar o contrasinal</Link>
          </div>
        </Panel>
      )}
    </>
  );
}
