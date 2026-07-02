import { useState, useRef } from 'react';
import { api } from '../services/api';
import { ArrowLeft, UploadCloud } from 'lucide-react';

interface CreatePinProps {
  onBack: () => void;
  onPinCreated: () => void;
}

export default function CreatePin({ onBack, onPinCreated }: CreatePinProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewURL(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError('Title is required'); return; }
    if (!file) { setError('An image file is required'); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      if (description.trim()) {
        fd.append('description', description.trim());
      }
      fd.append('image', file);

      await api.pins.create(fd);
      onPinCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create pin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-pin-page">
      <div className="create-pin-header">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="create-pin-title">Create Pin</h1>
      </div>

      <div className="create-pin-layout">
        {/* Image upload area */}
        <div 
          className="create-pin-preview" 
          onClick={() => fileInputRef.current?.click()}
          style={{ cursor: 'pointer' }}
        >
          {previewURL ? (
            <img
              src={previewURL}
              alt="Preview"
              className="create-pin-preview-img"
            />
          ) : (
            <div className="create-pin-placeholder">
              <UploadCloud size={40} />
              <p>Click to upload an image</p>
              <small style={{ color: 'var(--color-text-secondary)' }}>JPG, PNG, WEBP</small>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/jpeg, image/png, image/webp"
            onChange={handleFileChange}
          />
        </div>

        {/* Form */}
        <form className="create-pin-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              className="form-input"
              type="text"
              placeholder="Give your pin a title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={150}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              placeholder="Tell everyone what this pin is about…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              maxLength={500}
            />
          </div>

          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

          <div style={{ marginTop: 'auto', textAlign: 'right' }}>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Creating…' : 'Save Pin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
