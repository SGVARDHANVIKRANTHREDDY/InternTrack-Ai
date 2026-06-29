import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Building2, Globe, MapPin, BriefcaseBusiness } from 'lucide-react';

export default function Companies() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ companyName: '', industry: '', location: '', companyWebsite: '' });

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => apiRequest('/companies')
  });

  const createCompany = useMutation({
    mutationFn: (newCompany: any) => apiRequest('/companies', {
      method: 'POST',
      body: JSON.stringify(newCompany)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsOpen(false);
      setFormData({ companyName: '', industry: '', location: '', companyWebsite: '' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCompany.mutate(formData);
  };

  if (isLoading) return <div>Loading companies...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Companies</h1>
          <p className="text-sm text-stone-500">Manage companies you are applying to.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white border-0 shadow">
            <Plus className="w-4 h-4 mr-2" />
            Add Company
          </DialogTrigger>
          <DialogContent className="bg-white border-stone-200 text-stone-900">
            <DialogHeader>
              <DialogTitle>Add New Company</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Name</label>
                <Input required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Industry</label>
                <Input value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Website</label>
                <Input type="url" value={formData.companyWebsite} onChange={e => setFormData({...formData, companyWebsite: e.target.value})} className="bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400" />
              </div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white border-0" disabled={createCompany.isPending}>Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {companies?.map((company: any) => (
          <div key={company.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-stone-900">{company.companyName}</h3>
            </div>
            <div className="space-y-2 text-sm text-stone-500">
              {company.industry && <div className="flex items-center gap-2"><BriefcaseBusiness className="w-4 h-4 text-stone-400" /> {company.industry}</div>}
              {company.location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-stone-400" /> {company.location}</div>}
              {company.companyWebsite && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-stone-400" /> 
                  <a href={company.companyWebsite} target="_blank" rel="noreferrer" className="text-amber-600 hover:text-amber-700 transition-colors truncate">
                    {company.companyWebsite.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
        {companies?.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-stone-200 rounded-2xl text-stone-500">
            No companies added yet. Click "Add Company" to get started.
          </div>
        )}
      </div>
    </div>
  );
}
