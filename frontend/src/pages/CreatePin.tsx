import { useState } from 'react';
import { api } from '../services/api';
import { ArrowLeft, ImageIcon, Loader } from 'lucide-react';

interface CreatePinProps {
  onBack: () => void;
  onPinCreated: () => void;
}

export default function CreatePin({ onBack, onPinCreated }: CreatePinProps) {
  const [title, setTitle] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError('Title is required'); return; }
    if (!imageURL.trim()) { setError('Image URL is required'); return; }

    setLoading(true);
    try {
      await api.pins.create({
        title: title.trim(),
        imageURL: imageURL.trim(),
        description: description.trim() || undefined,
      });
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
        {/* Image preview */}
        <div className="create-pin-preview">
          {imageURL && !previewError ? (
            <img
              src={imageURL}
              alt="Preview"
              className="create-pin-preview-img"
              onError={() => setPreviewError(true)}
            />
          ) : (
            <div className="create-pin-placeholder">
              <ImageIcon size={40} />
              <p>{previewError ? 'Could not load image URL' : 'Paste an image URL to preview'}</p>
            </div>
          )}
        </div>

        {/* Form */}
        <form className="create-pin-form" onSubmit={handleSubmit}>

          <div className="form-group">
            <label className="form-label">Image URL *</label>
            <input
              className="form-input"
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={imageURL}
              onChange={e => { setImageURL(e.target.value); setPreviewError(false); }}
              required
            />
          </div>

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
              rows={4}
              maxLength={500}
              style={{ resize: 'vertical' }}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || !title.trim() || !imageURL.trim()}
          >
            {loading ? (
              <><Loader size={16} className="spin" /> Publishing…</>
            ) : (
              'Publish Pin'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
