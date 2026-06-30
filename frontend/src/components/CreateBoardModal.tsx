import { useState } from 'react';
import { Lock, Globe, X } from 'lucide-react';
import { api } from '../services/api';
import type { Board } from '../services/api';

interface CreateBoardModalProps {
  onClose: () => void;
  onSuccess: (board: Board) => void;
}

export default function CreateBoardModal({ onClose, onSuccess }: CreateBoardModalProps) {
  const [boardName, setBoardName] = useState('');
  const [boardDesc, setBoardDesc] = useState('');
  const [boardSecret, setBoardSecret] = useState(false);
  const [boardSaving, setBoardSaving] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName.trim()) return;
    setBoardSaving(true);
    setBoardError(null);
    try {
      const res = await api.boards.create({
        name: boardName.trim(),
        description: boardDesc.trim() || undefined,
        secret: boardSecret,
      });
      onSuccess(res.data);
    } catch (err: any) {
      setBoardError(err.message || 'Failed to create board');
    } finally {
      setBoardSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Board</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleCreateBoard} className="modal-form">
          <div className="form-group">
            <label className="form-label">Board name *</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Inspiration"
              value={boardName}
              onChange={e => setBoardName(e.target.value)}
              maxLength={50}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              placeholder="What's this board about?"
              value={boardDesc}
              onChange={e => setBoardDesc(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="form-group-row">
            <label className="form-label">Secret board</label>
            <button
              type="button"
              className={`toggle-btn ${boardSecret ? 'on' : 'off'}`}
              onClick={() => setBoardSecret(v => !v)}
            >
              {boardSecret ? <Lock size={14} /> : <Globe size={14} />}
              {boardSecret ? 'Secret' : 'Public'}
            </button>
          </div>
          {boardError && <div className="auth-error">{boardError}</div>}
          <button type="submit" className="auth-submit-btn" disabled={boardSaving || !boardName.trim()}>
            {boardSaving ? 'Creating…' : 'Create Board'}
          </button>
        </form>
      </div>
    </div>
  );
}
