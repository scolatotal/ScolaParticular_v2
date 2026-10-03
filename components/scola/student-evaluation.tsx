'use client';

import { useState } from 'react';
import { BookOpenCheck, ClipboardCheck } from 'lucide-react';
import { today } from '@/lib/dates';
import type { DataRow } from '@/lib/entities';
import { textValue } from '@/lib/entities';
import { Collection } from './shared';
import { useApp } from './provider';

const periods = [
  { value: 'Avaliación Inicial', label: 'Avaliación Inicial' },
  { value: '1º Trimestre', label: '1º T' },
  { value: '2º Trimestre', label: '2º Trimestre' },
  { value: '3º Trimestre', label: '3º Trimestre' },
] as const;

export function StudentEvaluation({ student }: { student: DataRow }) {
  const { data } = useApp();
  const [period, setPeriod] = useState<(typeof periods)[number]['value']>(
    'Avaliación Inicial',
  );
  const academicYear = textValue(data.profiles[0], 'academic_year') || '2026/27';
  const matchesPeriod = (row: DataRow) =>
    row.student_id === student.id &&
    row.academic_year === academicYear &&
    row.period === period;
  const defaults = {
    student_id: student.id,
    academic_year: academicYear,
    period,
    assessment_date: today(),
  };
  const entries = data.evaluation_entries.filter(matchesPeriod);
  const rubrics = data.evaluation_rubrics.filter(matchesPeriod);

  return (
    <section className="evaluation-notebook" aria-labelledby="evaluation-title">
      <div className="evaluation-intro">
        <div>
          <span className="evaluation-icon" aria-hidden="true">
            <BookOpenCheck size={22} />
          </span>
          <div>
            <h2 id="evaluation-title">Caderno de avaliación</h2>
            <p>Curso {academicYear} · organiza notas, evidencias e rúbricas por período.</p>
          </div>
        </div>
        <span className="evaluation-count">
          {entries.length} notas · {rubrics.length} rúbricas
        </span>
      </div>

      <div className="tabs evaluation-period-tabs" role="tablist" aria-label="Período de avaliación">
        {periods.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={period === item.value}
            className={period === item.value ? 'active' : ''}
            onClick={() => setPeriod(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="evaluation-columns" role="tabpanel">
        <div className="evaluation-section">
          <div className="evaluation-section-heading">
            <ClipboardCheck size={19} aria-hidden="true" />
            <div>
              <h3>Notas e cualificacións</h3>
              <p>Rexistra unha cualificación, evidencia ou observación de cada tema.</p>
            </div>
          </div>
          <Collection
            compact
            table="evaluation_entries"
            rows={entries}
            defaults={defaults}
            hideFilters
          />
        </div>

        <div className="evaluation-section">
          <div className="evaluation-section-heading">
            <BookOpenCheck size={19} aria-hidden="true" />
            <div>
              <h3>Rúbricas de avaliación</h3>
              <p>Define criterios e niveis de desempeño para os diferentes temas.</p>
            </div>
          </div>
          <Collection
            compact
            table="evaluation_rubrics"
            rows={rubrics}
            defaults={defaults}
            hideFilters
          />
        </div>
      </div>
    </section>
  );
}
