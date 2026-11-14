import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export interface ApplicationFilterState {
  search: string;
  statuses: string[];
  priorities: string[];
  sources: string[];
  companies: string[];
  startDate: string;
  endDate: string;
  sort: string;
  view: 'table' | 'cards';
  appId: string | null;
}

export function useApplicationFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: ApplicationFilterState = useMemo(() => {
    return {
      search: searchParams.get('search') || '',
      statuses: searchParams.get('status') ? searchParams.get('status')!.split(',').filter(Boolean) : [],
      priorities: searchParams.get('priority') ? searchParams.get('priority')!.split(',').filter(Boolean) : [],
      sources: searchParams.get('source') ? searchParams.get('source')!.split(',').filter(Boolean) : [],
      companies: searchParams.get('company') ? searchParams.get('company')!.split(',').filter(Boolean) : [],
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      sort: searchParams.get('sort') || 'newest',
      view: (searchParams.get('view') as 'table' | 'cards') || 'table',
      appId: searchParams.get('appId') || null,
    };
  }, [searchParams]);

  const updateFilters = useCallback(
    (newParams: Partial<Record<keyof ApplicationFilterState, any>>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);

          Object.entries(newParams).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
              next.delete(key);
            } else if (Array.isArray(value)) {
              next.set(key, value.join(','));
            } else {
              next.set(key, String(value));
            }
          });

          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams();
        if (prev.get('view')) next.set('view', prev.get('view')!);
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const setAppId = useCallback(
    (id: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set('appId', id);
          else next.delete('appId');
          return next;
        },
        { replace: false } // Creates history entry so back button closes drawer
      );
    },
    [setSearchParams]
  );

  return {
    filters,
    updateFilters,
    resetFilters,
    setAppId,
  };
}
