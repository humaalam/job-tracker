import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useState } from 'react';
import { useChangeApplicationStatus } from '../../hooks/useApplicationMutations.js';
import { STATUS_LABELS } from '../../lib/format.js';
import ErrorMessage from '../ui/ErrorMessage.jsx';
import ApplicationCard from './ApplicationCard.jsx';

const handleClass =
  'h-fit shrink-0 cursor-grab touch-none rounded px-1 text-lg leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900';

// Keyboard moves: Left/Right jump straight to the previous/next column
// (dnd-kit's default would move the card 25 pixels per key press).
function columnKeyboardCoordinates(event, { currentCoordinates, context }) {
  const direction = { ArrowRight: 1, ArrowLeft: -1 }[event.code];
  const { collisionRect, droppableRects } = context;
  if (!direction || !collisionRect) return undefined;
  event.preventDefault();

  const center = collisionRect.left + collisionRect.width / 2;
  const columns = [...droppableRects.values()].sort((a, b) => a.left - b.left);
  const target =
    direction === 1
      ? columns.find((rect) => rect.left > center)
      : columns.findLast((rect) => rect.left + rect.width < center);
  if (!target) return currentCoordinates; // already in the first/last column

  // Shift the card so its center lands on the target column's center.
  return {
    x: currentCoordinates.x + target.left + target.width / 2 - center,
    y: currentCoordinates.y,
  };
}

// What screen readers hear while dragging. dnd-kit's defaults would read out
// the ids (long UUIDs), so we use company and column names instead.
const announcements = {
  onDragStart: ({ active }) => `Picked up ${active.data.current.application.company}.`,
  onDragOver: ({ active, over }) =>
    over
      ? `${active.data.current.application.company} is over the ${STATUS_LABELS[over.id]} column.`
      : `${active.data.current.application.company} is not over a column.`,
  onDragEnd: ({ active, over }) =>
    over
      ? `${active.data.current.application.company} was dropped in the ${STATUS_LABELS[over.id]} column.`
      : `${active.data.current.application.company} was dropped outside the columns and stays where it was.`,
  onDragCancel: ({ active }) => `Moving ${active.data.current.application.company} was cancelled.`,
};

const screenReaderInstructions = {
  draggable:
    'To move an application to another status, press Space or Enter. Use the Left and Right arrow keys to choose a column, then press Space or Enter to drop it, or Escape to cancel.',
};

// A card that can be picked up by its handle (not the whole card, so the
// company link stays a normal link).
function DraggableCard({ application }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: application.id,
    data: { application },
  });

  return (
    <li ref={setNodeRef}>
      <ApplicationCard
        application={application}
        // While dragging, the copy in <DragOverlay> follows the pointer and this
        // one stays behind, faded, to show where the card came from.
        className={isDragging ? 'opacity-40' : ''}
        handle={
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Move ${application.company}`}
            className={handleClass}
          >
            ⠿
          </button>
        }
      />
    </li>
  );
}

// One column per status, e.g. "Applied (3)". It is also the drop target:
// its droppable id is the status, so a drop tells us the new status directly.
function KanbanColumn({ status, applications }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const headingId = `kanban-column-${status}`;

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      className={`flex w-64 shrink-0 flex-col rounded-lg p-2 ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-slate-100'
      }`}
    >
      <h2 id={headingId} className="px-1 pb-2 text-sm font-semibold text-slate-700">
        {STATUS_LABELS[status]}{' '}
        <span className="font-normal text-slate-500">({applications.length})</span>
      </h2>
      <ul className="flex flex-1 flex-col gap-2">
        {applications.map((application) => (
          <DraggableCard key={application.id} application={application} />
        ))}
      </ul>
      {applications.length === 0 && (
        <p className="px-1 py-4 text-center text-xs text-slate-400">No applications</p>
      )}
    </section>
  );
}

// `statuses` = which columns to show, in order. `applications` arrive already
// sorted by the API; grouping keeps that order inside each column.
export default function KanbanBoard({ statuses, applications }) {
  const byStatus = Object.groupBy(applications, (application) => application.status);
  const changeStatus = useChangeApplicationStatus();
  // The card being dragged right now (shown in the overlay), or null.
  const [activeApplication, setActiveApplication] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: columnKeyboardCoordinates }),
  );

  function handleDragStart({ active }) {
    changeStatus.reset(); // hide the error of an earlier failed move
    setActiveApplication(active.data.current.application);
  }

  function handleDragEnd({ active, over }) {
    setActiveApplication(null);
    const { application } = active.data.current;
    // Dropped outside a column, or back into its own column: nothing to save.
    if (!over || over.id === application.status) return;
    changeStatus.mutate({ id: application.id, status: over.id });
  }

  return (
    <DndContext
      sensors={sensors}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveApplication(null)}
    >
      {changeStatus.isError && (
        <ErrorMessage className="mb-3">
          Couldn&apos;t move the card: {changeStatus.error.message}
        </ErrorMessage>
      )}

      {/* Six columns don't fit on small screens, so the board scrolls sideways. */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {statuses.map((status) => (
          <KanbanColumn key={status} status={status} applications={byStatus[status] ?? []} />
        ))}
      </div>

      {/* The overlay floats above the page, so the dragged card isn't cut off
          by the board's sideways scroll area. */}
      <DragOverlay>
        {activeApplication && (
          <ApplicationCard
            application={activeApplication}
            className="cursor-grabbing shadow-lg ring-2 ring-blue-300"
            handle={<span className={handleClass}>⠿</span>}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
