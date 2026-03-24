import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaints, CATEGORIES } from '../api';
import styles from './NewComplaint.module.css';

const categoryLabels = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  elevator: 'Elevator/Lift',
  common_areas: 'Common Areas',
  security: 'Security',
  cleanliness: 'Cleanliness',
  structural: 'Structural',
  noise: 'Noise Complaint',
  parking: 'Parking',
  other: 'Other'
};

export default function NewComplaint() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [flatNumber, setFlatNumber] = useState(user?.flatNumber || '');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const subcategories = category ? (CATEGORIES[category]?.subcategories || []) : [];

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const base64s = await Promise.all(files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }));
    setImages(prev => [...prev, ...base64s]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const created = await complaints.create({
        category,
        subcategory: subcategory || undefined,
        title,
        description,
        location: location || undefined,
        flatNumber: flatNumber || undefined,
        images: images.length > 0 ? images : undefined
      });
      navigate(`/complaints/${created.id}`);
    } catch (err) {
      setError(err.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1>File New Complaint</h1>
      <p className={styles.subtitle}>Describe your issue and we'll track it for you.</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.field}>
          <label>Category *</label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setSubcategory(''); }}
            required
          >
            <option value="">Select category...</option>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {subcategories.length > 0 && (
          <div className={styles.field}>
            <label>Subcategory</label>
            <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
              <option value="">Select subcategory...</option>
              {subcategories.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.field}>
          <label>Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Kitchen sink leaking badly"
            minLength={3}
            maxLength={200}
            required
          />
        </div>

        <div className={styles.field}>
          <label>Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail..."
            rows={4}
            minLength={10}
            required
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>Flat Number</label>
            <input
              type="text"
              value={flatNumber}
              onChange={(e) => setFlatNumber(e.target.value)}
              placeholder="e.g. 302"
            />
          </div>
          <div className={styles.field}>
            <label>Location / Room</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kitchen"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label>Photos (Optional)</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} />
          {images.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {images.map((img, i) => (
                <img key={i} src={img} alt="preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '4px' }} />
              ))}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
          <button type="button" className={styles.cancel} onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
