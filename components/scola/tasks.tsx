'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Check, ListChecks, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dateLabel } from '@/lib/dates';
import { errorMessage } from '@/lib/validation';
import { textValue, type DataRow } from '@/lib/entities';
import { useToday } from '@/hooks/use-today';
import { RecordDetails } from './editor';
import { useApp } from './provider';
import { Empty, PageHeading } from './shared';

type TaskFilter = 'pending' | 'completed';

export function Tasks() {
  const { data, edit, save, notice } = useApp();
  const today = useToday();
  const [filter, setFilter] = useState<TaskFilter>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<DataRow | null>(null);
  const pendingCount = data.tasks.filter((task) => !task.completed).length;
  const completedCount = data.tasks.length - pendingCount;
  const tasks = useMemo(
    () =>
      data.tasks
        .filter((task) =>
          filter === 'completed' ? Boolean(task.completed) : !task.completed,
        )
        .sort((a, b) => {
          const aDue = textValue(a, 'due_date') || '9999-12-31';
          const bDue = textValue(b, 'due_date') || '9999-12-31';
          return (
            aDue.localeCompare(bDue) ||
            textValue(a, 'created_at').localeCompare(
              textValue(b, 'created_at'),
            )
          );
        }),
    [data.tasks, filter],
  );

  const toggleTask = async (task: DataRow) => {
    setBusyId(task.id);
    try {
      await save('tasks', { completed: !task.completed }, task.id);
    } catch (error) {
      notice(errorMessage(error), true);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="tasks-page">
      <PageHeading
        eyebrow="O QUE QUEDA POR FACER"
        title="Tarefas"
        description="Organiza as tarefas pendentes e marca cada unha ao completala."
        actions={
          <Button className="primary" onClick={() => edit('tasks')}>
            <Plus size={17} />
            Nova tarefa
          </Button>
        }
      />

      <section className="collection-panel tasks-panel">
        <div className="tasks-overview" aria-label="Resumo das tarefas">
          <div>
            <ListChecks size={22} />
            <span>Pendentes</span>
            <strong>{pendingCount}</strong>
          </div>
          <div>
            <Check size={22} />
            <span>Completadas</span>
            <strong>{completedCount}</strong>
          </div>
        </div>

        <div className="segmented task-filters" aria-label="Filtrar tarefas">
          <button
            type="button"
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pendentes ({pendingCount})
          </button>
          <button
            type="button"
            className={filter === 'completed' ? 'active' : ''}
            onClick={() => setFilter('completed')}
          >
            Completadas ({completedCount})
          </button>
        </div>

        {tasks.length ? (
          <div className="task-list">
            {tasks.map((task) => {
              const dueDate = textValue(task, 'due_date');
              const completed = Boolean(task.completed);
              const overdue = Boolean(dueDate && dueDate < today && !completed);
              return (
                <article
                  className={`task-row ${completed ? 'is-complete' : ''}`}
                  key={task.id}
                >
                  <label className="task-checkbox">
                    <input
                      type="checkbox"
                      checked={completed}
                      disabled={busyId === task.id}
                      onChange={() => void toggleTask(task)}
                      aria-label={`${completed ? 'Marcar como pendente' : 'Marcar como completada'}: ${textValue(task, 'title')}`}
                    />
                    <span aria-hidden="true">
                      <Check size={15} />
                    </span>
                  </label>
                  <button
                    type="button"
                    className="task-content"
                    onClick={() => setSelectedTask(task)}
                  >
                    <strong>{textValue(task, 'title')}</strong>
                    {textValue(task, 'notes') && (
                      <span>{textValue(task, 'notes')}</span>
                    )}
                    {dueDate && (
                      <small className={overdue ? 'is-overdue' : ''}>
                        <CalendarDays size={14} />
                        {overdue ? 'Vencida · ' : 'Data límite · '}
                        {dateLabel(dueDate)}
                      </small>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <Empty
            title={
              filter === 'pending'
                ? 'Non tes tarefas pendentes'
                : 'Aínda non completaches tarefas'
            }
            description={
              filter === 'pending'
                ? 'Todo ao día. Crea unha tarefa cando teñas algo por facer.'
                : 'As tarefas aparecerán aquí cando as marques como completadas.'
            }
            action={
              filter === 'pending' ? (
                <Button className="primary" onClick={() => edit('tasks')}>
                  <Plus size={16} />
                  Crear tarefa
                </Button>
              ) : undefined
            }
          />
        )}
      </section>
      {selectedTask && (
        <RecordDetails
          table="tasks"
          row={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
