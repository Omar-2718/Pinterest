import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { Pin, User } from '../services/api';
import PinCard from '../components/PinCard';
import MasonryGrid from '../components/MasonryGrid';
import { ArrowLeft, UserPlus, UserMinus, Users } from 'lucide-react';

interface UserProfileProps {
  userId: string;
  userName: string;
  userAvatar: string;
  currentUser: User;
  onBack: () => void;
  onOpenPin: (id: string) => void;
  onCurrentUserUpdate: (user: User) => void;
}

export default function UserProfile({
  userId,
  userName,
  userAvatar,
  currentUser,
  onBack,
  onOpenPin,
  onCurrentUserUpdate,
}: UserProfileProps) {
  const [pins, setPins]           = useState<Pin[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // Follow state derived from currentUser.followings
  const isOwnProfile = userId === currentUser._id;
  const [following, setFollowing] = useState(
    (currentUser.followings ?? []).includes(userId)
  );
  const [followLoading, setFollowLoading] = useState(false);

  // Followers / following counts of target user
  const [followerCount, setFollowerCount] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all pins and filter for this user
        const res = await api.pins.getAll({ limit: 100 });
        const theirs = res.data.filter(p => {
          if (typeof p.createdBy === 'object') return p.createdBy._id === userId;
          return p.createdBy === userId;
        });
        setPins(theirs);
      } catch (err: any) {
        setError(err.message || 'Failed to load pins');
      } finally {
        setLoading(false);
      }
    };

    // Fetch follower count (the endpoint returns OWN user's followers when called with any :id
    // so we just show a best-effort count)
    const loadFollowers = async () => {
      try {
        const res = await api.social.getFollowers(userId);
        setFollowerCount(res.results ?? res.data.length);
      } catch {
        // silently ignore
      }
    };

    load();
    loadFollowers();
  }, [userId]);

  const handleFollow = useCallback(async () => {
    if (followLoading) return;
    setFollowLoading(true);
    const next = !following;
    setFollowing(next);
    try {
      if (next) {
        await api.social.follow(userId);
      } else {
        await api.social.unfollow(userId);
      }
      // Refresh currentUser so followings list is up to date
      const meRes = await api.auth.getMe();
      onCurrentUserUpdate(meRes.data.user);
      setFollowing((meRes.data.user.followings ?? []).includes(userId));
    } catch (err: any) {
      setFollowing(!next);
      alert(err.message || 'Action failed');
    } finally {
      setFollowLoading(false);
    }
  }, [userId, following, followLoading, onCurrentUserUpdate]);

  // initials fallback avatar
  const initials = userName.charAt(0).toUpperCase();

  return (
    <div className="profile-page">
      <button className="btn-back" onClick={onBack}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <div className="profile-header">
        {/* Avatar */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e60023, #ad081b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 36,
            flexShrink: 0,
          }}
        >
          {userAvatar && userAvatar !== 'default.jpg' ? (
            <img
              src={`/uploads/users/${userId}/${userAvatar}`}
              alt={userName}
              style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            initials
          )}
        </div>

        <h1 className="profile-name">{userName}</h1>

        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{pins.length}</span>
            <span className="stat-label">Pins</span>
          </div>
          {followerCount !== null && (
            <>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value">{followerCount}</span>
                <span className="stat-label">Followers</span>
              </div>
            </>
          )}
        </div>

        {/* Follow / Unfollow — only show for other users */}
        {!isOwnProfile && (
          <button
            className={`follow-btn ${following ? 'following' : ''}`}
            onClick={handleFollow}
            disabled={followLoading}
          >
            {followLoading ? (
              <><div className="loading-spinner" style={{ width: 14, height: 14 }} /> {following ? 'Unfollowing…' : 'Following…'}</>
            ) : following ? (
              <><UserMinus size={16} /> Unfollow</>
            ) : (
              <><UserPlus size={16} /> Follow</>
            )}
          </button>
        )}

        {isOwnProfile && (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            This is your profile
          </p>
        )}
      </div>

      {/* Pins */}
      <div style={{ borderBottom: '1px solid var(--color-border)', marginBottom: 24 }} />

      {loading ? (
        <div className="feed-loading">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="pin-skeleton" style={{ height: 200 }} />
          ))}
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <p>{error}</p>
        </div>
      ) : pins.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📌</div>
          <h3>{userName} hasn't created any pins yet</h3>
        </div>
      ) : (
        <>
          <div style={{ padding: '0 24px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
              {pins.length} {pins.length === 1 ? 'pin' : 'pins'} created
            </span>
          </div>
          <MasonryGrid>
            {pins.map(pin => (
              <PinCard
                key={pin._id}
                pin={pin}
                currentUser={currentUser}
                onOpen={() => onOpenPin(pin._id)}
              />
            ))}
          </MasonryGrid>
        </>
      )}
    </div>
  );
}
