import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  PointerSensor, 
  useSensor, 
  useSensors,
  useDroppable 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, differenceInDays } from 'date-fns';
import { 
  Plus, 
  Building, 
  Calendar, 
  Clock, 
  AlertCircle,
  KanbanSquare
} from 'lucide-react';
import { ApplicationDetailDrawer } from '../components/applications/ApplicationDetailDrawer';
import { ApplicationFormModal } from '../components/applications/ApplicationFormModal';

const COLUMNS = [
  'Wishlist', 'Applied', 'OA Scheduled', 'OA Completed', 
  'Interview Scheduled', 'Interview Completed', 'Offer Received', 'Rejected'
];

const COLUMN_COLORS: Record<string, { dot: string; header: string }> = {
  'Wishlist': { dot: 'bg-stone-400', header: 'text-stone-700 dark:text-stone-300' },
  'Applied': { dot: 'bg-sky-500', header: 'text-sky-700 dark:text-sky-400' },
  'OA Scheduled': { dot: 'bg-indigo-500', header: 'text-indigo-700 dark:text-indigo-400' },
  'OA Completed': { dot: 'bg-purple-500', header: 'text-purple-700 dark:text-purple-400' },
  'Interview Scheduled': { dot: 'bg-amber-500', header: 'text-amber-800 dark:text-amber-300' },
  'Interview Completed': { dot: 'bg-amber-600', header: 'text-amber-900 dark:text-amber-200' },
  'Offer Received': { dot: 'bg-emerald-500', header: 'text-emerald-700 dark:text-emerald-400' },
  'Rejected': { dot: 'bg-rose-500', header: 'text-rose-700 dark:text-rose-400' },
};

const PRIORITY_BADGES: Record<string, string> = {
  'High': 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50',
  'Medium': 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50',
  'Low': 'text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700',
};

function KanbanCard({ app, onClick }: { app: any; onClick?: () => void }) {
  const daysInStage = app.updatedAt ? differenceInDays(new Date(), new Date(app.updatedAt)) : 0;
  const deadlineDays = app.deadlineDate ? differenceInDays(new Date(app.deadlineDate), new Date()) : null;

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-3.5 rounded-2xl hover:border-amber-500/60 dark:hover:border-amber-500/60 transition-all shadow-xs hover:shadow-md cursor-pointer select-none space-y-2.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center font-bold text-[10px] text-stone-700 dark:text-stone-300 shrink-0">
            {app.company?.companyName?.[0]?.toUpperCase() || 'C'}
          </div>
          <span className="font-semibold text-xs text-stone-600 dark:text-stone-400 truncate">
            {app.company?.companyName}
          </span>
        </div>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${PRIORITY_BADGES[app.priority] || PRIORITY_BADGES['Medium']}`}>
          {app.priority}
        </span>
      </div>

      <div>
        <p className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate leading-snug">{app.role}</p>
      </div>

      <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500 pt-1.5 border-t border-stone-100 dark:border-stone-800/80">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-stone-400" />
          <span>{daysInStage === 0 ? 'Today' : `${daysInStage}d in stage`}</span>
        </span>

        {app.deadlineDate && (
          <span className={`flex items-center gap-1 ${deadlineDays !== null && deadlineDays < 3 && deadlineDays >= 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}`}>
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(app.deadlineDate), 'MMM d')}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function SortableItem({ id, app, onSelect }: { id: string; app: any; onSelect: (app: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className="mb-2.5 cursor-grab active:cursor-grabbing"
    >
      <KanbanCard app={app} onClick={() => onSelect(app)} />
    </div>
  );
}

function DroppableColumn({ 
  id, 
  title, 
  apps, 
  onSelectApp, 
  onQuickAdd 
}: { 
  id: string; 
  title: string; 
  apps: any[]; 
  onSelectApp: (app: any) => void; 
  onQuickAdd: (status: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const colStyle = COLUMN_COLORS[title] || { dot: 'bg-stone-400', header: 'text-stone-700' };

  return (
    <div className={`flex-shrink-0 w-80 bg-stone-100/60 dark:bg-stone-900/40 border rounded-2xl p-3 flex flex-col h-[calc(100vh-14rem)] overflow-hidden transition-colors ${
      isOver 
        ? 'border-amber-500/80 bg-amber-50/40 dark:bg-amber-950/20' 
        : 'border-stone-200/80 dark:border-stone-800/80'
    }`}>
      {/* Column Header */}
      <div className="flex items-center justify-between px-1.5 py-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${colStyle.dot}`} />
          <h3 className={`font-bold text-xs uppercase tracking-wider ${colStyle.header}`}>{title}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 px-2 py-0.5 rounded-md">
            {apps.length}
          </span>
          <button
            onClick={() => onQuickAdd(title)}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
            title={`Add application to ${title}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {/* Cards List */}
      <div 
        ref={setNodeRef} 
        className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar"
      >
        <SortableContext id={id} items={apps.map((a: any) => a.id)} strategy={verticalListSortingStrategy}>
          {apps.map((app: any) => (
            <SortableItem key={app.id} id={app.id} app={app} onSelect={onSelectApp} />
          ))}
        </SortableContext>

        {apps.length === 0 && (
          <div className="h-28 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl flex items-center justify-center text-xs text-stone-400 dark:text-stone-500">
            Drop cards here
          </div>
        )}
      </div>
    </div>
  );
}

export default function Kanban() {
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [initialStatusForForm, setInitialStatusForForm] = useState('Wishlist');
  const [mobileSelectedColumn, setMobileSelectedColumn] = useState('All');

  const { data: apps, isLoading } = useQuery({ 
    queryKey: ['applications'], 
    queryFn: () => apiRequest('/applications') 
  });

  const { data: companies } = useQuery({ 
    queryKey: ['companies'], 
    queryFn: () => apiRequest('/companies') 
  });

  const { data: resumes } = useQuery({ 
    queryKey: ['resumes'], 
    queryFn: () => apiRequest('/resumes') 
  });
  
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      apiRequest(`/applications/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ status }) 
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { distance: 5 } 
    })
  );

  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const appId = active.id;
    let newStatus = over.id;

    // If dropped on top of another card instead of directly on column container, find the parent column
    if (!COLUMNS.includes(newStatus)) {
      const targetCard = apps?.find((a: any) => a.id === newStatus);
      if (targetCard) newStatus = targetCard.status;
    }
    
    const app = apps?.find((a: any) => a.id === appId);
    if (app && app.status !== newStatus && COLUMNS.includes(newStatus)) {
      // Optimistic cache update
      queryClient.setQueryData(['applications'], (old: any) => 
        old ? old.map((a: any) => a.id === appId ? { ...a, status: newStatus } : a) : []
      );
      updateStatus.mutate({ id: appId, status: newStatus });
    }
  };

  const handleQuickAdd = (status: string) => {
    setInitialStatusForForm(status);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const activeApp = apps?.find((a: any) => a.id === activeDragId);

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Kanban Board
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Visualize your application pipeline and progress stages fluidly.
          </p>
        </div>

        {/* Mobile Column Filter Pills */}
        <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setMobileSelectedColumn('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border ${
              mobileSelectedColumn === 'All' 
                ? 'bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300' 
                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400'
            }`}
          >
            All Stages
          </button>
          {COLUMNS.map((col) => (
            <button
              key={col}
              onClick={() => setMobileSelectedColumn(col)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border ${
                mobileSelectedColumn === col 
                  ? 'bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300' 
                  : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400'
              }`}
            >
              {col}
            </button>
          ))}
        </div>
      </div>

      {/* Board Columns Container */}
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {COLUMNS
            .filter((col) => mobileSelectedColumn === 'All' || mobileSelectedColumn === col)
            .map((column) => (
              <DroppableColumn 
                key={column} 
                id={column} 
                title={column} 
                apps={(apps || []).filter((a: any) => a.status === column)} 
                onSelectApp={(app) => setSelectedApp(app)}
                onQuickAdd={handleQuickAdd}
              />
          ))}
        </div>

        {/* Drag Overlay for smooth card tilt */}
        <DragOverlay>
          {activeApp ? (
            <div className="rotate-2 shadow-2xl opacity-90 scale-105 pointer-events-none w-72">
              <KanbanCard app={activeApp} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Shared Detail Drawer from Phase 3 */}
      {selectedApp && (
        <ApplicationDetailDrawer
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          resumes={resumes || []}
        />
      )}

      {/* Quick Add Application Modal */}
      <ApplicationFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        companies={companies || []}
        resumes={resumes || []}
      />
    </div>
  );
}
