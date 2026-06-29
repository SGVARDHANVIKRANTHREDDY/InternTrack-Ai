import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BriefcaseBusiness } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex justify-center items-center">
        <div className="w-[800px] h-[800px] bg-amber-600/5 rounded-full blur-[120px] mix-blend-multiply opacity-50"></div>
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 text-stone-900">
            <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-amber-500 font-bold text-xl">I</div>
            <span className="text-2xl font-bold text-stone-900">InternTrack AI</span>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-stone-200 p-8 rounded-2xl shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-stone-900 mb-1">Create an account</h2>
            <p className="text-stone-500 text-sm">Start tracking your applications today</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">{error}</div>}
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Full Name</label>
              <Input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="John Doe"
                className="bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Email</label>
              <Input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="name@example.com"
                className="bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Password</label>
              <Input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="Create a strong password"
                className="bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400"
              />
            </div>
            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white border-0 py-6 font-semibold shadow-lg shadow-amber-900/10" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-stone-500">
            Already have an account? <Link to="/login" className="text-amber-600 hover:text-amber-700 font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
