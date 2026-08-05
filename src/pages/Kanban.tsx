import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

const COLUMNS = [
  'Wishlist', 'Applied', 'OA Scheduled', 'OA Completed', 
  'Interview Scheduled', 'Interview Completed', 'Offer Received', 'Rejected'
];

function SortableItem({ id, app }: { id: string, app: any }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 cursor-grab active:cursor-grabbing">
      <div className="bg-white border border-stone-200 p-3 rounded-xl hover:border-amber-500/50 transition-colors shadow-sm">
        <p className="font-bold text-sm text-stone-900 truncate">{app.company?.companyName}</p>
        <p className="text-xs text-stone-500 truncate mt-0.5">{app.role}</p>
        <div className="mt-3 flex gap-2">
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-stone-200 bg-stone-50 text-stone-600 rounded-md">
            {app.priority}
          </Badge>
        </div>
      </div>
    </div>
  );
}

import { useDroppable } from '@dnd-kit/core';

function DroppableColumn({ id, title, apps }: { id: string, title: string, apps: any[] }) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div className="flex-shrink-0 w-72 bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-col h-full max-h-full overflow-hidden shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-stone-900">{title}</h3>
        <span className="text-xs bg-white text-stone-600 border border-stone-200 px-2.5 py-1 rounded-md">
          {apps.length}
        </span>
      </div>
      
      <div ref={setNodeRef} className={`flex-1 overflow-y-auto custom-scrollbar transition-colors ${isOver ? 'bg-amber-50 rounded-xl' : ''}`}>
        <SortableContext id={id} items={apps.map((a:any) => a.id)} strategy={verticalListSortingStrategy}>
          {apps.map((app: any) => (
            <SortableItem key={app.id} id={app.id} app={app} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function Kanban() {
  const queryClient = useQueryClient();
  const { data: apps } = useQuery({ queryKey: ['applications'], queryFn: () => apiRequest('/applications') });
  
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => apiRequest(`/applications/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['applications'] })
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const appId = active.id;
    const newStatus = over.id; // column id
    
    const app = apps.find((a: any) => a.id === appId);
    if (app && app.status !== newStatus && COLUMNS.includes(newStatus)) {
      updateStatus.mutate({ id: appId, status: newStatus });
      // Optimistic update locally
      queryClient.setQueryData(['applications'], (old: any) => 
        old.map((a: any) => a.id === appId ? { ...a, status: newStatus } : a)
      );
    }
  };

  if (!apps) return <div>Loading...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Kanban Board</h1>
        <p className="text-sm text-stone-500">Drag and drop applications to update their status.</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex gap-5 overflow-x-auto pb-4 custom-scrollbar">
          {COLUMNS.map(column => (
            <DroppableColumn key={column} id={column} title={column} apps={apps.filter((a: any) => a.status === column)} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
