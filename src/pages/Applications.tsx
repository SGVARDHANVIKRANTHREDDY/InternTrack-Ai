import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { useApplicationFilters } from '../hooks/useApplicationFilters';
import { ApplicationTable } from '../components/applications/ApplicationTable';
import { ApplicationCard } from '../components/applications/ApplicationCard';
import { ApplicationFilterBar } from '../components/applications/ApplicationFilterBar';
import { ApplicationDetailDrawer } from '../components/applications/ApplicationDetailDrawer';
import { ApplicationFormModal } from '../components/applications/ApplicationFormModal';
import { Briefcase, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Applications() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, updateFilters, resetFilters, setAppId } = useApplicationFilters();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Deep link action check (e.g., ?action=new)
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('action');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Queries (preserving exact keys and contracts)
  const { data: apps, isLoading: appsLoading } = useQuery<any[]>({
    queryKey: ['applications'],
    queryFn: () => apiRequest('/applications'),
  });

  const { data: companies } = useQuery<any[]>({
    queryKey: ['companies'],
    queryFn: () => apiRequest('/companies'),
  });

  const { data: resumes } = useQuery<any[]>({
    queryKey: ['resumes'],
    queryFn: () => apiRequest('/resumes'),
  });

  // Fast status update mutation (shared with Table)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest(`/applications/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });

  // Filter & Search Logic
  const filteredApps = useMemo(() => {
    if (!apps) return [];

    return apps.filter((app) => {
      const searchLower = filters.search.toLowerCase();
      const roleMatch = app.role.toLowerCase().includes(searchLower);
      const companyMatch = app.company?.companyName?.toLowerCase().includes(searchLower);

      if (filters.search && !roleMatch && !companyMatch) return false;

      if (filters.statuses.length > 0 && !filters.statuses.includes(app.status)) return false;
      if (filters.priorities.length > 0 && !filters.priorities.includes(app.priority)) return false;
      if (filters.sources.length > 0 && !filters.sources.includes(app.source)) return false;
      if (filters.companies.length > 0 && !filters.companies.includes(app.companyId)) return false;

      if (filters.startDate) {
        const appDate = new Date(app.createdAt);
        const start = new Date(filters.startDate);
        if (appDate < start) return false;
      }

      if (filters.endDate) {
        const appDate = new Date(app.createdAt);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (appDate > end) return false;
      }

      return true;
    });
  }, [apps, filters]);

  // Sort Logic
  const sortedApps = useMemo(() => {
    return [...filteredApps].sort((a, b) => {
      if (filters.sort === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (filters.sort === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (filters.sort === 'deadline') {
        if (!a.deadlineDate) return 1;
        if (!b.deadlineDate) return -1;
        return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime();
      }
      if (filters.sort === 'company') {
        return (a.company?.companyName || '').localeCompare(b.company?.companyName || '');
      }
      if (filters.sort === 'priority') {
        const pVal = (p: string) => (p === 'High' ? 3 : p === 'Medium' ? 2 : 1);
        return pVal(b.priority) - pVal(a.priority);
      }
      return 0;
    });
  }, [filteredApps, filters.sort]);

  // Selected Application for Detail Drawer
  const selectedApp = useMemo(() => {
    if (!filters.appId || !apps) return null;
    return apps.find((a) => a.id === filters.appId) || null;
  }, [filters.appId, apps]);

  if (appsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Applications
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Track, inspect, and optimize your internship applications.
          </p>
        </div>
      </div>

      {/* Attio-Style Filter Bar */}
      <ApplicationFilterBar
        filters={filters}
        onUpdateFilters={updateFilters}
        onResetFilters={resetFilters}
        onNewApplication={() => setIsFormOpen(true)}
        totalCount={apps?.length || 0}
        filteredApps={sortedApps}
      />

      {/* Main Content View */}
      {sortedApps.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">No applications match your filters</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1 leading-normal">
              {apps && apps.length > 0 
                ? 'Try broadening your search term or clearing active filters to see all applications.' 
                : 'Get started by tracking your first internship application.'}
            </p>
          </div>
          {apps && apps.length > 0 ? (
            <Button
              variant="outline"
              onClick={resetFilters}
              className="text-xs rounded-xl"
            >
              Clear Active Filters
            </Button>
          ) : (
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Your First Application
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className={filters.view === 'cards' ? 'hidden' : 'hidden sm:block'}>
            <ApplicationTable
              applications={sortedApps}
              selectedAppId={filters.appId}
              onSelectApp={(app) => setAppId(app.id)}
              onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
              sortOption={filters.sort}
              onSortChange={(sort) => updateFilters({ sort })}
            />
          </div>

          {/* Mobile & Card View */}
          <div className={filters.view === 'cards' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' : 'sm:hidden space-y-3'}>
            {sortedApps.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                onSelect={(app) => setAppId(app.id)}
                isSelected={filters.appId === app.id}
              />
            ))}
          </div>
        </>
      )}

      {/* Form Modal */}
      <ApplicationFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        companies={companies || []}
        resumes={resumes || []}
      />

      {/* Unified Inspector Drawer */}
      {selectedApp && (
        <ApplicationDetailDrawer
          app={selectedApp}
          onClose={() => setAppId(null)}
          resumes={resumes || []}
        />
      )}
    </div>
  );
}
