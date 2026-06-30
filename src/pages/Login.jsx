import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/orders');
    } catch (err) {
      toast.error(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in">
      <img src="/icon-192.png" alt="Cadence" className="w-24 h-24 mb-6" />
      <h1 className="text-3xl font-bold tracking-tight mb-2">Bon retour !</h1>
      <p className="text-text-secondary text-center mb-8">Connectez-vous pour gérer votre restaurant</p>

      <form className="w-full max-w-sm space-y-5" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Adresse e-mail</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input
              id="email"
              type="email"
              className="form-input pl-10"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="form-group">
          <div className="flex justify-between items-center mb-1.5">
            <label className="form-label !mb-0" htmlFor="password">Mot de passe</label>
            <button type="button" className="text-xs text-olive font-medium hover:underline">
              Mot de passe oublié ?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="form-input pl-10 pr-10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button 
              type="button" 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full mt-4"
          disabled={loading}
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : 'Se connecter'}
        </button>
      </form>

      <p className="mt-8 text-sm text-text-secondary">
        Pas encore de compte ? <Link to="/register" className="text-olive font-bold hover:underline">S'inscrire</Link>
      </p>
    </div>
  );
}
