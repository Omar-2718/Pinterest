import { useState } from 'react';
import { api } from '../services/api';
import type { Pin, User } from '../services/api';
import { Heart, Bookmark, Trash2 } from 'lucide-react';
import SaveBoardPicker from './SaveBoardPicker';


interface PinCardProps {
  pin: Pin;
  currentUser: User;
  onOpen: () => void;
  onUserClick?: (userId: string, userName: string, userAvatar: string) => void;
  onLikeToggle?: (pinId: string, liked: boolean) => void;
  onDelete?: (pinId: string) => void;
  onRemoveFromBoard?: (pinId: string) => void;
}

function getCreator(pin: Pin): { _id: string; name: string; avatar: string } | null {
  if (!pin.createdBy) return null;
  if (typeof pin.createdBy === 'object') return pin.createdBy;
  return null;
}

export default function PinCard({
  pin,
  currentUser,
  onOpen,
  onUserClick,
  onLikeToggle,
  onDelete,
  onRemoveFromBoard,
}: PinCardProps) {
  const [imageError, setImageError] = useState(false);

  const isLiked = (pin.likedBy ?? []).includes(currentUser._id);
  const isSaved = (currentUser.savedPins ?? []).includes(pin._id);
  const creator = getCreator(pin);
  const isOwner = creator ? creator._id === currentUser._id : false;

  const [liked,    setLiked]    = useState(isLiked);
  const [saved,    setSaved]    = useState(isSaved);
  const [liking,   setLiking]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removing, setRemoving] = useState(false);

  const baseCount = pin.likedBy?.length ?? 0;
  const likeCount = baseCount + (liked !== isLiked ? (liked ? 1 : -1) : 0);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liking) return;
    setLiking(true);
    const next = !liked;
    setLiked(next);
    onLikeToggle?.(pin._id, next);
    try {
      if (next) await api.pins.like(pin._id);
      else       await api.pins.unlike(pin._id);
    } catch {
      setLiked(!next);
      onLikeToggle?.(pin._id, !next);
    } finally {
      setLiking(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saving) return;
    setSaving(true);
    const next = !saved;
    setSaved(next);
    try {
      if (next) await api.pins.save(pin._id);
      else       await api.pins.unsave(pin._id);
    } catch {
      setSaved(!next);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this pin permanently?')) return;
    setDeleting(true);
    try {
      await api.pins.delete(pin._id);
      onDelete?.(pin._id);
    } catch (err: any) {
      alert(err.message || 'Could not delete');
      setDeleting(false);
    }
  };

  const handleRemoveFromBoard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Remove this pin from the board?')) return;
    setRemoving(true);
    try {
      // The parent component handles the actual API call and state update
      if (onRemoveFromBoard) onRemoveFromBoard(pin._id);
    } catch (err: any) {
      alert(err.message || 'Could not remove');
      setRemoving(false);
    }
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (creator && onUserClick) {
      onUserClick(creator._id, creator.name, creator.avatar);
    }
  };

  return (
    <div className="pin-card" onClick={onOpen}>
      {imageError ? (
        <div className="pin-image-fallback">
          <span>📌</span>
          <small>{pin.title}</small>
        </div>
      ) : (
        <img
          src={pin.imageURL}
          alt={pin.title}
          className="pin-image"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      )}

      <div className="pin-overlay">
        <div className="pin-actions-top">
          <div className="save-button-group">
            <button
              className={`save-btn ${saved ? 'saved' : ''}`}
              onClick={handleSave}
              disabled={saving}
              title={saved ? 'Unsave from Profile' : 'Save to Profile'}
            >
              <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
              {saved ? 'Saved' : 'Save'}
            </button>
            <SaveBoardPicker pinId={pin._id} />
          </div>

          {onRemoveFromBoard ? (
            <button
              className="delete-btn"
              onClick={handleRemoveFromBoard}
              disabled={removing}
              title="Remove from board"
              style={{ backgroundColor: 'white', color: '#111' }}
            >
              <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>✕</span>
            </button>
          ) : isOwner ? (
            <button
              className="delete-btn"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          ) : null}
        </div>


        <div className="pin-actions-bottom">
          <button
            className={`pin-like-btn ${liked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={liking}
            title={liked ? 'Unlike' : 'Like'}
          >
            <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
        </div>
      </div>

      <div className="pin-info">
        <p className="pin-title">{pin.title}</p>
        {creator && (
          <button
            className={`pin-creator ${onUserClick ? 'clickable-creator' : ''}`}
            onClick={handleCreatorClick}
            title={`View ${creator.name}'s profile`}
          >
            <span className="creator-avatar-tiny">
              {creator.name.charAt(0).toUpperCase()}
            </span>
            <span className="creator-name">{creator.name}</span>
          </button>
        )}
      </div>
    </div>
  );
}
