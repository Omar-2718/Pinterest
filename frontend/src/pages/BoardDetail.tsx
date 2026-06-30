import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Board, Pin, User } from '../services/api';
import PinCard from '../components/PinCard';
import MasonryGrid from '../components/MasonryGrid';
import { ArrowLeft, Edit2, Lock, X, RefreshCw } from 'lucide-react';

interface BoardDetailProps {
  boardId: string;
  onBack: () => void;
  currentUser: User;
  onOpenPin: (pinId: string) => void;
  onOpenUser: (userId: string, userName: string, userAvatar: string) => void;
}

export default function BoardDetail({ boardId, onBack, currentUser, onOpenPin, onOpenUser }: BoardDetailProps) {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSecret, setEditSecret] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const fetchBoard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.boards.getById(boardId);
      setBoard(res.data);
      setEditName(res.data.name);
      setEditDesc(res.data.description || '');
      setEditSecret(res.data.secret || false);
    } catch (err: any) {
      setError(err.message || 'Could not load board');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, [boardId]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setEditSaving(true);
    try {
      const res = await api.boards.update(boardId, {
        name: editName.trim(),
        secret: editSecret,
        // The backend schema might not support updating description depending on its strictness,
        // but we pass it anyway.
      });
      setBoard(prev => prev ? { ...prev, ...res.data } : res.data);
      setShowEdit(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update board');
    } finally {
      setEditSaving(false);
    }
  };

  const handleRemovePin = async (pinId: string) => {
    try {
      await api.boards.removePin(boardId, pinId);
      setBoard(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          pins: prev.pins?.filter(p => {
            if (typeof p === 'object') return p._id !== pinId;
            return p !== pinId;
          }),
        };
      });
    } catch (err: any) {
      alert(err.message || 'Failed to remove pin');
      throw err; // rethrow so PinCard catches it if needed
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <button className="btn-back" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto', width: 40, height: 40 }} />
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="profile-page">
        <button className="btn-back" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <h3>{error || 'Board not found'}</h3>
          <button className="btn-primary" onClick={fetchBoard}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // Cast pins since they should be populated.
  // If backend returns only IDs, this map will produce empty items.
  const pins = (board.pins || []).filter(p => typeof p === 'object') as Pin[];

  // Determine if the current user owns this board
  const creatorId = typeof board.createdBy === 'object' ? board.createdBy._id : board.createdBy;
  const isOwner = creatorId === currentUser._id;

  return (
    <div className="profile-page">
      <button className="btn-back" onClick={onBack}><ArrowLeft size={16} /> Back</button>

      <div style={{ textAlign: 'center', margin: '40px 0 20px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {board.secret && <span title="Secret Board"><Lock size={24} style={{ color: 'var(--color-text-secondary)' }} /></span>}
          {board.name}
        </h1>
        {board.description && <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', maxWidth: 600, margin: '0 auto 16px' }}>{board.description}</p>}
        
        {isOwner && (
          <button className="btn-secondary" style={{ padding: '8px 16px', borderRadius: 24 }} onClick={() => setShowEdit(true)}>
            <Edit2 size={14} style={{ marginRight: 6 }} />
            Edit Board
          </button>
        )}
      </div>

      <div style={{ fontSize: '1.2rem', fontWeight: 600, margin: '20px 0', paddingLeft: 8 }}>
        {pins.length} {pins.length === 1 ? 'Pin' : 'Pins'}
      </div>

      {pins.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗂️</div>
          <h3>This board is empty</h3>
          <p>Save some pins to this board to see them here.</p>
        </div>
      ) : (
        <MasonryGrid>
          {pins.map(pin => (
            <PinCard
              key={pin._id}
              pin={pin}
              currentUser={currentUser}
              onOpen={() => onOpenPin(pin._id)}
              onUserClick={onOpenUser}
              onRemoveFromBoard={isOwner ? () => handleRemovePin(pin._id) : undefined}
            />
          ))}
        </MasonryGrid>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="modal-backdrop" onClick={() => setShowEdit(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Board</h2>
              <button className="modal-close" onClick={() => setShowEdit(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="form-group-row">
                <label className="form-label">Keep this board secret</label>
                <button
                  type="button"
                  className={`toggle-btn ${editSecret ? 'on' : 'off'}`}
                  onClick={() => setEditSecret(v => !v)}
                >
                  {editSecret ? <Lock size={14} /> : '🌍'}
                  {editSecret ? 'Secret' : 'Public'}
                </button>
              </div>
              <button type="submit" className="auth-submit-btn" disabled={editSaving || !editName.trim()}>
                {editSaving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
