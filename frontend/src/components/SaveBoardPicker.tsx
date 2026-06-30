import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Board } from '../services/api';
import { ChevronDown, Check, Loader2 } from 'lucide-react';

interface SaveBoardPickerProps {
  pinId: string;
}

export default function SaveBoardPicker({ pinId }: SaveBoardPickerProps) {
  const [open, setOpen] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Load boards when menu opens
  useEffect(() => {
    if (open && boards.length === 0) {
      setLoading(true);
      api.boards.getMyBoards()
        .then(res => setBoards(res.data ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, boards.length]);

  const handleSaveToBoard = async (e: React.MouseEvent, board: Board) => {
    e.stopPropagation();
    if (savingId) return;
    setSavingId(board._id);
    try {
      await api.boards.addPin(board._id, pinId);
      // Close after short delay for feedback
      setTimeout(() => setOpen(false), 600);
    } catch (err: any) {
      alert(err.message || 'Could not save to board');
      setSavingId(null);
    }
  };

  return (
    <div className="board-picker-wrapper" onClick={e => e.stopPropagation()}>
      <button
        className="board-picker-trigger"
        onClick={e => { e.stopPropagation(); setOpen(!open); }}
        title="Save to a board"
      >
        <ChevronDown size={14} />
      </button>

      {open && (
        <>
          <div className="board-picker-backdrop" onClick={e => { e.stopPropagation(); setOpen(false); }} />
          <div className="board-picker-menu">
            <div className="board-picker-header">Save to board</div>
            
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <Loader2 size={16} className="spin" style={{ margin: '0 auto' }} />
              </div>
            ) : boards.length === 0 ? (
              <div className="board-picker-empty">No boards yet</div>
            ) : (
              <div className="board-picker-list">
                {boards.map(board => {
                  const isSaving = savingId === board._id;
                  const hasPin = (board.pins || []).some(p => {
                    if (typeof p === 'object') return p._id === pinId;
                    return p === pinId;
                  });

                  return (
                    <button
                      key={board._id}
                      className="board-picker-item"
                      onClick={e => handleSaveToBoard(e, board)}
                      disabled={isSaving || hasPin}
                    >
                      <span className="board-picker-name">{board.name}</span>
                      {isSaving ? (
                        <Loader2 size={14} className="spin" />
                      ) : hasPin ? (
                        <Check size={14} style={{ color: 'var(--color-primary)' }} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
