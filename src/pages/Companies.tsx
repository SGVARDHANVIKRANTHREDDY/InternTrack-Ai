import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { 
  Building2, 
  Plus, 
  Globe, 
  MapPin, 
  BriefcaseBusiness, 
  Search,
  ExternalLink 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EmptyState } from '../components/ui/empty-state';

export default function Companies() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    location: '',
    companyWebsite: ''
  });

  const { data: companies = [], isLoading } = useQuery<any[]>({
    queryKey: ['companies'],
    queryFn: () => apiRequest('/companies'),
  });

  const createCompany = useMutation({
    mutationFn: (newCompany: any) =>
      apiRequest('/companies', {
        method: 'POST',
        body: JSON.stringify(newCompany),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsOpen(false);
      setFormData({ companyName: '', industry: '', location: '', companyWebsite: '' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) return;
    createCompany.mutate(formData);
  };

  const filteredCompanies = companies.filter((c: any) => {
    const q = search.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(q) ||
      (c.industry && c.industry.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q))
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
          <span className="text-xs text-stone-500 font-mono">Loading companies...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-600" />
            Company Directory
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Manage target employers, recruitment portals, and headquarters locations.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <button 
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-xl shadow-xs hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Company</span>
          </button>
          <DialogContent className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 max-w-md w-[95vw]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-stone-900 dark:text-stone-100">
                Add New Company
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Company Name *
                </label>
                <input
                  required
                  placeholder="e.g. Stripe"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Industry / Domain
                </label>
                <input
                  placeholder="e.g. Financial Infrastructure"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Location / HQ
                </label>
                <input
                  placeholder="e.g. San Francisco, CA / Remote"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Careers Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://stripe.com/jobs"
                  value={formData.companyWebsite}
                  onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                  className="w-full text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCompany.isPending}
                  className="px-4 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                >
                  {createCompany.isPending ? 'Saving...' : 'Save Company'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Filter companies by name, domain, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs pl-9 pr-3 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      {/* Grid */}
      {filteredCompanies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies found"
          description={companies.length === 0 ? "Get started by adding your first target company." : "No companies match your search criteria."}
          action={{
            label: "Add Company",
            onClick: () => setIsOpen(true),
            icon: Plus
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company: any) => (
            <div
              key={company.id}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs hover:border-amber-300 dark:hover:border-amber-800 transition-colors space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 font-bold text-sm shrink-0">
                  {company.companyName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                    {company.companyName}
                  </h3>
                  {company.industry && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                      {company.industry}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800/80">
                {company.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{company.location}</span>
                  </div>
                )}
                {company.companyWebsite && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <a
                      href={company.companyWebsite}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-600 dark:text-amber-400 hover:underline transition-colors truncate flex items-center gap-1"
                    >
                      <span>{company.companyWebsite.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
