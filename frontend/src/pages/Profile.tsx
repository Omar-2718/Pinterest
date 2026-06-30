import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import type { Pin, User, Board } from '../services/api';
import { AvatarImg } from '../App';
import PinCard from '../components/PinCard';
import MasonryGrid from '../components/MasonryGrid';
import CreateBoardModal from '../components/CreateBoardModal';
import { Edit2, Camera, Check, X, Plus, Lock, Globe, Trash2 } from 'lucide-react';

interface ProfileProps {
  currentUser: User;
  onOpenPin: (id: string) => void;
  onOpenUser: (userId: string, userName: string, userAvatar: string) => void;
  onUserUpdate: (user: User) => void;
  onOpenBoard?: (boardId: string) => void;
}

type Tab = 'created' | 'saved' | 'boards';
type SocialModal = 'followers' | 'following' | null;

export default function Profile({ currentUser, onOpenPin, onOpenUser, onUserUpdate, onOpenBoard }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<Tab>('created');

  const [createdPins, setCreatedPins] = useState<Pin[]>([]);
  const [savedPins, setSavedPins]     = useState<Pin[]>([]);
  const [boards, setBoards]           = useState<Board[]>([]);

  const [pinsLoading, setPinsLoading]     = useState(true);
  const [savedLoading, setSavedLoading]   = useState(false);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [pinsError, setPinsError]         = useState<string | null>(null);

  // Followers / following — populated user list (called on demand by modal)
  const [socialModal, setSocialModal]           = useState<SocialModal>(null);
  const [socialList, setSocialList]             = useState<User[]>([]);
  const [socialLoading, setSocialLoading]       = useState(false);

  // Raw counts from currentUser (IDs only, immediately available)
  const followerCount  = (currentUser.followers  ?? []).length;
  const followingCount = (currentUser.followings ?? []).length;

  // Edit name
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState(currentUser.name);
  const [nameSaving, setNameSaving]   = useState(false);

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Board modal
  const [showBoardModal, setShowBoardModal] = useState(false);

  // ── Load created pins ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setPinsLoading(true);
      setPinsError(null);
      try {
        const res = await api.pins.getAll({ limit: 100 });
        const mine = res.data.filter(p => {
          if (typeof p.createdBy === 'object') return p.createdBy._id === currentUser._id;
          return p.createdBy === currentUser._id;
        });
        setCreatedPins(mine);
      } catch (err: any) {
        setPinsError(err.message || 'Failed to load pins');
      } finally {
        setPinsLoading(false);
      }
    };
    load();
  }, [currentUser._id]);

  // ── Load saved pins when tab switches ─────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'saved') return;
    const load = async () => {
      setSavedLoading(true);
      try {
        const res = await api.pins.getSaved();
        setSavedPins(res.data ?? []);
      } catch {
        // fallback: individual fetches
        if (currentUser.savedPins && currentUser.savedPins.length > 0) {
          const results = await Promise.all(
            currentUser.savedPins.map(id =>
              api.pins.getById(id).then(r => r.data).catch(() => null)
            )
          );
          setSavedPins(results.filter(Boolean) as Pin[]);
        } else {
          setSavedPins([]);
        }
      } finally {
        setSavedLoading(false);
      }
    };
    load();
  }, [activeTab, currentUser.savedPins, currentUser._id]);

  // ── Load boards when tab switches ──────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'boards') return;
    const load = async () => {
      setBoardsLoading(true);
      try {
        const res = await api.boards.getMyBoards();
        setBoards(res.data ?? []);
      } catch {
        setBoards([]);
      } finally {
        setBoardsLoading(false);
      }
    };
    load();
  }, [activeTab]);

  // ── Open followers/following modal — THESE call getFollowers / getFollowing ─
  const openSocialModal = async (type: SocialModal) => {
    if (!type) return;
    setSocialModal(type);
    setSocialLoading(true);
    setSocialList([]);
    try {
      const res = type === 'followers'
        ? await api.social.getFollowers(currentUser._id)  // GET /api/v1/users/:id/followers
        : await api.social.getFollowing(currentUser._id); // GET /api/v1/users/:id/following
      setSocialList(res.data ?? []);
    } catch {
      setSocialList([]);
    } finally {
      setSocialLoading(false);
    }
  };

  // ── Update name ────────────────────────────────────────────────────────────
  const handleNameSave = async () => {
    if (!nameInput.trim() || nameInput === currentUser.name) { setEditingName(false); return; }
    setNameSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', nameInput.trim());
      const res = await api.auth.updateMe(fd);
      onUserUpdate(res.data.updatedUser);
      setEditingName(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update name');
    } finally {
      setNameSaving(false);
    }
  };

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    fd.append('name', currentUser.name);
    try {
      const res = await api.auth.updateMe(fd);
      onUserUpdate(res.data.updatedUser);
    } catch (err: any) {
      alert(err.message || 'Failed to upload avatar');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };



  // ── Delete board ───────────────────────────────────────────────────────────
  const handleDeleteBoard = async (boardId: string) => {
    if (!window.confirm('Delete this board?')) return;
    try {
      await api.boards.delete(boardId);
      setBoards(prev => prev.filter(b => b._id !== boardId));
    } catch (err: any) {
      alert(err.message || 'Could not delete board');
    }
  };

  const handlePinDelete = (pinId: string) => {
    setCreatedPins(prev => prev.filter(p => p._id !== pinId));
    setSavedPins(prev => prev.filter(p => p._id !== pinId));
  };

  const displayPins    = activeTab === 'created' ? createdPins : savedPins;
  const displayLoading = activeTab === 'created' ? pinsLoading
                       : activeTab === 'saved'   ? savedLoading
                       : boardsLoading;

  return (
    <div className="profile-page">

      {/* ── Header ── */}
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          <AvatarImg user={currentUser} size={96} />
          <button className="avatar-upload-btn" onClick={() => fileInputRef.current?.click()}>
            <Camera size={14} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleAvatarChange}
          />
        </div>

        <div className="profile-name-row">
          {editingName ? (
            <div className="name-edit-group">
              <input
                className="name-edit-input"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') setEditingName(false);
                }}
                autoFocus
              />
              <button className="name-edit-confirm" onClick={handleNameSave} disabled={nameSaving}>
                <Check size={14} />
              </button>
              <button className="name-edit-cancel" onClick={() => { setEditingName(false); setNameInput(currentUser.name); }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <h1 className="profile-name">{currentUser.name}</h1>
              <button className="edit-name-btn" onClick={() => setEditingName(true)}>
                <Edit2 size={14} />
              </button>
            </>
          )}
        </div>

        <p className="profile-email">{currentUser.email}</p>

        {/* ── Stats — follower/following counts are CLICKABLE ── */}
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{createdPins.length}</span>
            <span className="stat-label">Pins</span>
          </div>
          <div className="stat-divider" />

          {/* Clicking "Followers" calls GET /api/v1/users/:id/followers */}
          <button
            className="stat-item stat-item-btn"
            onClick={() => openSocialModal('followers')}
            title="See who follows you"
          >
            <span className="stat-value">{followerCount}</span>
            <span className="stat-label">Followers</span>
          </button>
          <div className="stat-divider" />

          {/* Clicking "Following" calls GET /api/v1/users/:id/following */}
          <button
            className="stat-item stat-item-btn"
            onClick={() => openSocialModal('following')}
            title="See who you follow"
          >
            <span className="stat-value">{followingCount}</span>
            <span className="stat-label">Following</span>
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="profile-tabs">
        <button className={`profile-tab ${activeTab === 'created' ? 'active' : ''}`} onClick={() => setActiveTab('created')}>
          Created ({createdPins.length})
        </button>
        <button className={`profile-tab ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
          Saved {savedPins.length > 0 && `(${savedPins.length})`}
        </button>
        <button className={`profile-tab ${activeTab === 'boards' ? 'active' : ''}`} onClick={() => setActiveTab('boards')}>
          Boards {boards.length > 0 && `(${boards.length})`}
        </button>
      </div>

      {/* ── Pin / Board Content ── */}
      {displayLoading ? (
        <div className="feed-loading">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="pin-skeleton" style={{ height: 200 }} />
          ))}
        </div>
      ) : pinsError && activeTab === 'created' ? (
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <p>{pinsError}</p>
        </div>

      ) : activeTab === 'boards' ? (
        <div className="boards-section">
          <div className="boards-header">
            <h2 className="boards-section-title">My Boards</h2>
            <button className="btn-primary" onClick={() => setShowBoardModal(true)}>
              <Plus size={16} /> New Board
            </button>
          </div>
          {boards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗂️</div>
              <h3>No boards yet</h3>
              <p>Create a board to organise your saved pins into collections.</p>
              <button className="btn-primary" onClick={() => setShowBoardModal(true)}>
                <Plus size={16} /> Create Board
              </button>
            </div>
          ) : (
            <div className="board-grid-profile">
              {boards.map(b => (
                <BoardCard key={b._id} board={b} onDelete={() => handleDeleteBoard(b._id)} onClick={() => onOpenBoard?.(b._id)} />
              ))}
            </div>
          )}
        </div>

      ) : displayPins.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{activeTab === 'created' ? '📌' : '🔖'}</div>
          <h3>{activeTab === 'created' ? 'No pins created yet' : 'No saved pins yet'}</h3>
          <p>{activeTab === 'created' ? 'Create a pin to see it here.' : 'Save pins from the home feed to see them here.'}</p>
        </div>
      ) : (
        <MasonryGrid>
          {displayPins.map(pin => (
            <PinCard
              key={pin._id}
              pin={pin}
              currentUser={currentUser}
              onOpen={() => onOpenPin(pin._id)}
              onUserClick={onOpenUser}
              onDelete={handlePinDelete}
            />
          ))}
        </MasonryGrid>
      )}

      {/* ── Followers / Following modal ── */}
      {socialModal && (
        <div className="modal-backdrop" onClick={() => setSocialModal(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{socialModal === 'followers' ? 'Followers' : 'Following'}</h2>
              <button className="modal-close" onClick={() => setSocialModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '12px 24px 24px', maxHeight: 420, overflowY: 'auto' }}>
              {socialLoading ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <div className="loading-spinner" style={{ margin: '0 auto' }} />
                </div>
              ) : socialList.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '24px 0' }}>
                  {socialModal === 'followers' ? 'No followers yet' : "You're not following anyone yet"}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {socialList.map(u => (
                    <button
                      key={u._id}
                      className="liker-row"
                      onClick={() => {
                        setSocialModal(null);
                        onOpenUser(u._id, u.name, u.avatar);
                      }}
                    >
                      <div className="creator-avatar-circle" style={{ width: 40, height: 40, fontSize: '1.1rem' }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</div>
                        {u.email && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{u.email}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Create Board modal ── */}
      {showBoardModal && (
        <CreateBoardModal
          onClose={() => setShowBoardModal(false)}
          onSuccess={(board) => {
            setBoards(prev => [board, ...prev]);
            setShowBoardModal(false);
          }}
        />
      )}
    </div>
  );
}

// ── Board Card ──────────────────────────────────────────────────────────────
function BoardCard({ board: initialBoard, onDelete, onClick }: { board: Board; onDelete: () => void, onClick?: () => void }) {
  const [board, setBoard] = useState(initialBoard);

  useEffect(() => {
    // If the board has pins but they are just strings (IDs), fetch the populated board
    const hasUnpopulatedPins = (board.pins || []).some(p => typeof p === 'string');
    if (hasUnpopulatedPins) {
      api.boards.getById(board._id)
        .then(res => setBoard(res.data))
        .catch(() => {});
    }
  }, [board._id, board.pins]);

  const pinCount   = board.pins?.length ?? 0;
  const previewPins = (board.pins ?? []).slice(0, 3) as any[];

  return (
    <div className="board-card-profile" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="board-card-preview-grid">
        {previewPins.length === 0 ? (
          <div className="board-card-empty-preview">🗂️</div>
        ) : (
          previewPins.map((pin, i) => (
            <div key={i} className="board-preview-cell">
              {typeof pin === 'object' && pin.imageURL
                ? <img src={pin.imageURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ background: '#eee', width: '100%', height: '100%' }} />}
            </div>
          ))
        )}
      </div>
      <div className="board-card-meta">
        <div>
          <div className="board-card-name">
            {board.secret && <Lock size={12} style={{ marginRight: 4, opacity: 0.7 }} />}
            {board.name}
          </div>
          <div className="board-card-count">{pinCount} {pinCount === 1 ? 'pin' : 'pins'}</div>
        </div>
        <button className="board-delete-btn" onClick={e => { e.stopPropagation(); onDelete(); }} title="Delete board">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
