import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Store, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Register() {
  const [restaurantName, setRestaurantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!restaurantName || !email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, restaurantName);
      toast.success('Compte créé avec succès !');
      // No email confirmation required, immediate redirect
      navigate('/orders');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in">
      <img src="/icon-192.png" alt="Cadence" className="w-20 h-20 mb-6" />
      <h1 className="text-2xl font-bold tracking-tight mb-2">Rejoignez CADENCE</h1>
      <p className="text-text-secondary text-center mb-8">Créez votre espace restaurant en quelques secondes</p>

      <form className="w-full max-w-sm space-y-5" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="restaurant">Nom du restaurant</label>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input
              id="restaurant"
              type="text"
              className="form-input pl-10"
              placeholder="Le Petit Bistrot"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
            />
          </div>
        </div>

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
          <label className="form-label" htmlFor="password">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="form-input pl-10 pr-10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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
          ) : 'Créer mon compte'}
        </button>
      </form>

      <p className="mt-8 text-sm text-text-secondary">
        Déjà un compte ? <Link to="/login" className="text-olive font-bold hover:underline">Se connecter</Link>
      </p>
    </div>
  );
}
