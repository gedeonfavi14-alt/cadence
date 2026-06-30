import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Trash2, Camera, Video } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function AddEditDish() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { restaurant } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(isEdit);
  const [file, setFile] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    media_url: '',
    media_type: 'photo',
    active: true
  });

  useEffect(() => {
    if (isEdit && restaurant) {
      fetchDish();
    }
  }, [isEdit, restaurant]);

  async function fetchDish() {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('id', id)
        .eq('restaurant_id', restaurant.id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name,
          price: data.price.toString(),
          category: data.category || '',
          description: data.description || '',
          media_url: data.media_url || '',
          media_type: data.media_type || 'photo',
          active: data.active
        });
      }
    } catch (err) {
      toast.error('Erreur lors du chargement du plat');
      navigate('/menu-manage');
    } finally {
      setInitLoading(false);
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-detect type
      if (selectedFile.type.startsWith('video/')) {
        setFormData(prev => ({ ...prev, media_type: 'video' }));
      } else {
        setFormData(prev => ({ ...prev, media_type: 'photo' }));
      }
      
      // Local preview
      const previewUrl = URL.createObjectURL(selectedFile);
      setFormData(prev => ({ ...prev, media_url: previewUrl }));
    }
  };

  async function uploadMedia(fileObj) {
    const fileExt = fileObj.name.split('.').pop();
    const fileName = `${restaurant.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, fileObj);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Le nom et le prix sont obligatoires');
      return;
    }

    setLoading(true);
    try {
      let finalMediaUrl = formData.media_url;

      if (file) {
        finalMediaUrl = await uploadMedia(file);
      }

      const dishData = {
        restaurant_id: restaurant.id,
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        description: formData.description,
        media_url: finalMediaUrl,
        media_type: formData.media_type,
        active: formData.active
      };

      if (isEdit) {
        const { error } = await supabase
          .from('dishes')
          .update(dishData)
          .eq('id', id);
        if (error) throw error;
        toast.success('Plat modifié avec succès');
      } else {
        const { error } = await supabase
          .from('dishes')
          .insert(dishData);
        if (error) throw error;
        toast.success('Plat ajouté avec succès');
      }

      navigate('/menu-manage');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Voulez-vous vraiment supprimer ce plat ? Cette action est irréversible.')) {
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('dishes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      toast.success('Plat supprimé');
      navigate('/menu-manage');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
      setLoading(false);
    }
  }

  if (initLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-olive border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigate('/menu-manage')}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">{isEdit ? 'Modifier le plat' : 'Nouveau plat'}</h1>
        
        {isEdit && (
          <button 
            onClick={handleDelete}
            className="ml-auto p-2 text-red-500 hover:bg-red-500/10 rounded-full"
            disabled={loading}
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Media Upload Area (Vertical format preview) */}
        <div className="flex flex-col items-center mb-6">
          <label className="relative w-[180px] h-[320px] bg-bg-elevated rounded-xl border-2 border-dashed border-border-strong flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-olive transition-colors">
            {formData.media_url ? (
              <>
                {formData.media_type === 'video' ? (
                  <video src={formData.media_url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                ) : (
                  <img src={formData.media_url} alt="Preview" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-semibold flex items-center gap-2"><Upload size={18}/> Changer</span>
                </div>
              </>
            ) : (
              <div className="text-center text-text-muted p-4">
                <Upload size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium mb-1">Ajouter média</p>
                <p className="text-[10px]">Photo ou vidéo (9:16 recommandé)</p>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*,video/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </label>
          
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${formData.media_type === 'photo' ? 'border-olive text-olive bg-olive/10' : 'border-border-strong text-text-muted'}`}
              onClick={() => setFormData(prev => ({ ...prev, media_type: 'photo' }))}
            >
              <Camera size={14} /> Photo
            </button>
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${formData.media_type === 'video' ? 'border-olive text-olive bg-olive/10' : 'border-border-strong text-text-muted'}`}
              onClick={() => setFormData(prev => ({ ...prev, media_type: 'video' }))}
            >
              <Video size={14} /> Vidéo
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="name">Nom du plat *</label>
          <input
            id="name"
            type="text"
            className="form-input"
            placeholder="Ex: Burger Classique"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label" htmlFor="price">Prix (FCFA) *</label>
            <input
              id="price"
              type="number"
              className="form-input"
              placeholder="Ex: 5000"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              required
              min="0"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="category">Catégorie</label>
            <select
              id="category"
              className="form-input"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">Sélectionner une catégorie</option>
              <option value="Entrées">Entrées</option>
              <option value="Plats principaux">Plats principaux</option>
              <option value="Accompagnements">Accompagnements</option>
              <option value="Desserts">Desserts</option>
              <option value="Boissons">Boissons</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">Description</label>
          <textarea
            id="description"
            className="form-input"
            placeholder="Ingrédients, particularités..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows="3"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-bg-elevated rounded-xl border border-border-light mt-2">
          <div>
            <div className="font-semibold text-sm">Plat disponible</div>
            <div className="text-xs text-text-secondary">Les clients peuvent commander ce plat</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={formData.active}
              onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-olive"></div>
          </label>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full mt-6"
          disabled={loading}
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : 'Enregistrer le plat'}
        </button>
      </form>
    </div>
  );
}
