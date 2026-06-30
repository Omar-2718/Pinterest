import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import type { Pin, User, Comment } from '../services/api';
import { AvatarImg } from '../App';
import {
  Heart, Bookmark, ArrowLeft, Trash2, ExternalLink,
  Send, MessageCircle, ChevronDown, ChevronUp, X
} from 'lucide-react';
import SaveBoardPicker from '../components/SaveBoardPicker';


interface PinDetailProps {
  pinId: string;
  onBack: () => void;
  currentUser: User;
  onOpenUser: (userId: string, userName: string, userAvatar: string) => void;
}

function getCreator(pin: Pin): { _id: string; name: string; avatar: string } | null {
  if (!pin.createdBy) return null;
  if (typeof pin.createdBy === 'object') return pin.createdBy;
  return null;
}

export default function PinDetail({ pinId, onBack, currentUser, onOpenUser }: PinDetailProps) {
  const [pin, setPin]           = useState<Pin | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Like / Save
  const [liked, setLiked]             = useState(false);
  const [saved, setSaved]             = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Likers modal — calls GET /:id/like
  const [likersOpen, setLikersOpen]   = useState(false);
  const [likers, setLikers]           = useState<User[]>([]);
  const [likersLoading, setLikersLoading] = useState(false);

  // Comments
  const [commentText, setCommentText]       = useState('');
  const [commentPosting, setCommentPosting] = useState(false);
  const [commentError, setCommentError]     = useState<string | null>(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // ── Load pin + comments ───────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pinRes, commentsRes] = await Promise.all([
          api.pins.getById(pinId),
          api.pins.getComments(pinId, { limit: 50 }),
        ]);
        setPin(pinRes.data);
        setComments(commentsRes.data ?? []);
        setLiked((pinRes.data.likedBy ?? []).includes(currentUser._id));
        setSaved((currentUser.savedPins ?? []).includes(pinRes.data._id));
      } catch (err: any) {
        setError(err.message || 'Could not load pin');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pinId, currentUser._id, currentUser.savedPins]);

  // ── Like / Unlike ─────────────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (!pin || likeLoading) return;
    setLikeLoading(true);
    const next = !liked;
    setLiked(next);
    try {
      const res = next ? await api.pins.like(pin._id) : await api.pins.unlike(pin._id);
      setPin(res.data);
      setLiked((res.data.likedBy ?? []).includes(currentUser._id));
    } catch {
      setLiked(!next);
    } finally {
      setLikeLoading(false);
    }
  }, [pin, liked, likeLoading, currentUser._id]);

  // ── Save / Unsave ─────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!pin || saveLoading) return;
    setSaveLoading(true);
    const next = !saved;
    setSaved(next);
    try {
      if (next) await api.pins.save(pin._id);
      else       await api.pins.unsave(pin._id);
    } catch {
      setSaved(!next);
    } finally {
      setSaveLoading(false);
    }
  }, [pin, saved, saveLoading]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!pin || !window.confirm('Delete this pin permanently?')) return;
    setDeleteLoading(true);
    try {
      await api.pins.delete(pin._id);
      onBack();
    } catch (err: any) {
      alert(err.message || 'Could not delete');
      setDeleteLoading(false);
    }
  }, [pin, onBack]);

  // ── Likers modal — calls GET /api/v1/pins/:id/like ───────────────────────
  const openLikers = useCallback(async () => {
    if (!pin) return;
    setLikersOpen(true);
    setLikersLoading(true);
    try {
      const res = await api.pins.getLikes(pin._id);
      setLikers(res.data ?? []);
    } catch {
      setLikers([]);
    } finally {
      setLikersLoading(false);
    }
  }, [pin]);

  // ── Post Comment — calls POST /api/v1/pins/:id/comments ──────────────────
  const handleComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || !commentText.trim() || commentPosting) return;
    setCommentPosting(true);
    setCommentError(null);
    try {
      const res = await api.pins.addComment(pin._id, commentText.trim());
      const newComment: Comment = {
        ...res.data,
        madeBy: { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar },
      };
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
    } catch (err: any) {
      setCommentError(err.message || 'Failed to post comment');
    } finally {
      setCommentPosting(false);
    }
  }, [pin, commentText, commentPosting, currentUser]);

  // ── Render states ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="pin-detail-loading">
        <div className="loading-spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (error || !pin) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3>{error || 'Pin not found'}</h3>
        <button className="btn-primary" onClick={onBack}>
          <ArrowLeft size={16} /> Go back
        </button>
      </div>
    );
  }

  const creator   = getCreator(pin);
  const isOwner   = creator?._id === currentUser._id;
  const likeCount = pin.likedBy?.length ?? 0;
  const visibleComments = showAllComments ? comments : comments.slice(0, 5);

  return (
    <div className="pin-detail-page">
      <button className="btn-back" onClick={onBack}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="pin-detail-card">

        {/* ── Image ── */}
        <div className="pin-detail-image-wrap">
          {imageError ? (
            <div className="pin-image-fallback large">
              <span>📌</span>
              <p>{pin.title}</p>
            </div>
          ) : (
            <img
              src={pin.imageURL}
              alt={pin.title}
              className="pin-detail-image"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        {/* ── Info Panel ── */}
        <div className="pin-detail-info">

          {/* Action row */}
          <div className="pin-detail-actions">
            <button
              className={`action-btn ${liked ? 'liked' : ''}`}
              onClick={handleLike}
              disabled={likeLoading}
              title={liked ? 'Unlike' : 'Like'}
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            {/* Likers count — clicking opens modal and calls GET /:id/like */}
            {likeCount > 0 && (
              <button className="likers-trigger" onClick={openLikers} title="See who liked this">
                {likeCount} {likeCount === 1 ? 'like' : 'likes'}
              </button>
            )}

            <div className="save-button-group">
              <button
                className={`action-btn save ${saved ? 'saved' : ''}`}
                onClick={handleSave}
                disabled={saveLoading}
              >
                <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
                {saved ? 'Saved' : 'Save'}
              </button>
              <SaveBoardPicker pinId={pin._id} />
            </div>


            <a
              href={pin.imageURL}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn"
              title="Open source"
            >
              <ExternalLink size={18} />
            </a>

            {isOwner && (
              <button
                className="action-btn danger"
                onClick={handleDelete}
                disabled={deleteLoading}
                title="Delete pin"
              >
                <Trash2 size={16} />
                {deleteLoading ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>

          {/* Title + Description */}
          <h1 className="pin-detail-title">{pin.title}</h1>
          {pin.description && (
            <p className="pin-detail-description">{pin.description}</p>
          )}

          {/* Creator — clickable → navigate to their profile */}
          {creator && (
            <button
              className="pin-detail-creator clickable-creator"
              onClick={() => {
                if (creator._id === currentUser._id) return;
                onOpenUser(creator._id, creator.name, creator.avatar);
              }}
              title={creator._id !== currentUser._id ? `View ${creator.name}'s profile` : undefined}
              style={{ textAlign: 'left', background: 'none', cursor: creator._id !== currentUser._id ? 'pointer' : 'default' }}
            >
              {creator._id === currentUser._id ? (
                <AvatarImg user={currentUser} size={40} />
              ) : (
                <div className="creator-avatar-circle">
                  {creator.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600 }}>{creator.name}</div>
                {pin.createdAt && (
                  <div className="creator-date">
                    {new Date(pin.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </div>
                )}
                {creator._id !== currentUser._id && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: 2 }}>
                    View profile →
                  </div>
                )}
              </div>
            </button>
          )}

          {/* ── Comments ── */}
          <div className="pin-detail-comments">
            <h3 className="comments-title">
              <MessageCircle size={18} />
              Comments
              {comments.length > 0 && <span className="comment-count">{comments.length}</span>}
            </h3>

            {/* Post comment */}
            <form className="comment-form-area" onSubmit={handleComment}>
              <AvatarImg user={currentUser} size={32} />
              <div className="comment-input-wrap">
                <textarea
                  ref={commentInputRef}
                  className="comment-textarea"
                  placeholder="Add a comment…"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  rows={1}
                  maxLength={500}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleComment(e as any);
                    }
                  }}
                />
                <button
                  type="submit"
                  className="comment-send-btn"
                  disabled={!commentText.trim() || commentPosting}
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
            {commentError && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: 4 }}>{commentError}</p>
            )}

            {/* Comment list */}
            {comments.length === 0 ? (
              <div className="no-comments"><p>No comments yet. Be the first!</p></div>
            ) : (
              <>
                <div className="comment-list">
                  {visibleComments.map(c => {
                    const author = typeof c.madeBy === 'object' ? c.madeBy : null;
                    return (
                      <div key={c._id} className="comment-item">
                        <div className="comment-avatar">
                          {author ? author.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="comment-body">
                          {author && (
                            <button
                              className="comment-author clickable-creator"
                              style={{ background: 'none', cursor: author._id !== currentUser._id ? 'pointer' : 'default' }}
                              onClick={() => {
                                if (author._id !== currentUser._id)
                                  onOpenUser(author._id, author.name, author.avatar);
                              }}
                            >
                              {author.name}
                            </button>
                          )}
                          <p className="comment-text">{c.text}</p>
                          {c.createdAt && (
                            <span className="comment-time">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {comments.length > 5 && (
                  <button
                    className="comments-show-more"
                    onClick={() => setShowAllComments(v => !v)}
                  >
                    {showAllComments
                      ? <><ChevronUp size={14} /> Show less</>
                      : <><ChevronDown size={14} /> Show {comments.length - 5} more</>
                    }
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Likers Modal — GET /api/v1/pins/:id/like ── */}
      {likersOpen && (
        <div className="modal-backdrop" onClick={() => setLikersOpen(false)}>
          <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Heart size={18} style={{ color: 'var(--color-primary)' }} />
                Liked by
              </h2>
              <button className="modal-close" onClick={() => setLikersOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '12px 24px 24px', maxHeight: 400, overflowY: 'auto' }}>
              {likersLoading ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <div className="loading-spinner" style={{ margin: '0 auto' }} />
                </div>
              ) : likers.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '24px 0' }}>
                  No likes yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {likers.map(u => (
                    <button
                      key={u._id}
                      className="liker-row clickable-creator"
                      onClick={() => {
                        setLikersOpen(false);
                        if (u._id !== currentUser._id)
                          onOpenUser(u._id, u.name, u.avatar);
                      }}
                    >
                      <div className="creator-avatar-circle" style={{ width: 36, height: 36, fontSize: '1rem' }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500 }}>{u.name}</span>
                      {u._id === currentUser._id && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>You</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
