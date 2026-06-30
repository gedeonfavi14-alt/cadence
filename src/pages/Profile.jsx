import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, QrCode, Moon, Sun, Camera, Upload, Store } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const { restaurant, user, signOut, updateRestaurant } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(restaurant?.name || '');

  async function handleLogout() {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      toast.error('Erreur lors de la déconnexion');
    }
  }

  async function handleSaveName() {
    if (!name.trim()) return;
    if (name === restaurant?.name) return;
    
    setLoading(true);
    try {
      await updateRestaurant({ name });
      toast.success('Nom du restaurant mis à jour');
    } catch (err) {
      toast.error('Erreur de mise à jour');
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLoading(true);
      
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${restaurant.id}/logo_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);

        await updateRestaurant({ logo_url: publicUrl });
        toast.success('Logo mis à jour');
      } catch (err) {
        toast.error('Erreur lors de l\'envoi du logo');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Profil du restaurant</h1>
        <p className="text-text-secondary text-sm">Gérez vos paramètres et votre identité</p>
      </div>

      {/* Logo Upload */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative group">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-bg-elevated shadow-md bg-white">
            {restaurant?.logo_url ? (
              <img src={restaurant.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Store size={48} />
              </div>
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-olive text-white p-2.5 rounded-full shadow-lg cursor-pointer hover:bg-olive-light transition-colors active:scale-95">
            {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span> : <Camera size={18} />}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={loading} />
          </label>
        </div>
      </div>

      <div className="space-y-6">
        {/* Restaurant Name */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Identité</h3>
          <div className="form-group mb-2">
            <input
              type="text"
              className="form-input bg-transparent border-border-light text-lg font-bold px-0 focus:ring-0 focus:border-olive border-x-0 border-t-0 rounded-none pb-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSaveName}
            />
          </div>
          <div className="text-xs text-text-muted">L'e-mail du compte est : {user?.email}</div>
        </div>

        {/* Settings */}
        <div className="card p-0 overflow-hidden">
          <h3 className="text-sm font-semibold text-text-secondary p-5 pb-2 uppercase tracking-wider">Paramètres</h3>
          
          <div className="flex items-center justify-between p-5 border-b border-border-light">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <div className="font-semibold">Mode Sombre</div>
                <div className="text-xs text-text-muted">Apparence de l'interface</div>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer toggle-checkbox" 
                checked={theme === 'dark'}
                onChange={toggleTheme}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all toggle-label"></div>
            </label>
          </div>

          <button 
            className="w-full flex items-center justify-between p-5 border-b border-border-light hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
            onClick={() => navigate('/qrcode')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <QrCode size={20} />
              </div>
              <div>
                <div className="font-semibold">Code QR du Menu</div>
                <div className="text-xs text-text-muted">Afficher et télécharger</div>
              </div>
            </div>
            <div className="text-text-muted">→</div>
          </button>
        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="w-full card p-4 flex items-center justify-center gap-2 text-red-500 font-bold hover:bg-red-500/10 transition-colors border-red-500/20"
        >
          <LogOut size={20} />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
