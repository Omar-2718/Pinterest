import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { Pin, User } from '../services/api';
import MasonryGrid from '../components/MasonryGrid';
import PinCard from '../components/PinCard';
import { RefreshCw } from 'lucide-react';

interface HomeFeedProps {
  onOpenPin: (id: string) => void;
  onOpenUser: (userId: string, userName: string, userAvatar: string) => void;
  searchQuery: string;
  currentUser: User;
}

export default function HomeFeed({ onOpenPin, onOpenUser, searchQuery, currentUser }: HomeFeedProps) {
  const [pins, setPins]             = useState<Pin[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPins = useCallback(async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      if (reset) { setLoading(true); setError(null); }
      else setLoadingMore(true);

      let data: Pin[];
      if (searchQuery) {
        const res = await api.pins.search(searchQuery);
        data = res.data;
        setHasMore(false);
      } else {
        const res = await api.pins.getAll({ page: currentPage, limit: 20 });
        data = res.data;
        setHasMore(data.length === 20);
      }

      if (reset) {
        setPins(data);
        setPage(2);
      } else {
        setPins(prev => [...prev, ...data]);
        setPage(p => p + 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load pins');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, page]);

  useEffect(() => {
    fetchPins(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleLikeToggle = useCallback((pinId: string, liked: boolean) => {
    setPins(prev =>
      prev.map(p => {
        if (p._id !== pinId) return p;
        const likedBy = p.likedBy ?? [];
        return {
          ...p,
          likedBy: liked
            ? [...likedBy, currentUser._id]
            : likedBy.filter(id => id !== currentUser._id),
        };
      })
    );
  }, [currentUser._id]);

  if (loading) {
    return (
      <div className="feed-loading">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="pin-skeleton" style={{ height: Math.random() * 120 + 200 }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3>{error}</h3>
        <p>Make sure your backend is running at <code>localhost:3000</code></p>
        <button className="btn-primary" onClick={() => fetchPins(true)}>
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  if (pins.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">{searchQuery ? '🔍' : '📌'}</div>
        <h3>{searchQuery ? `No results for "${searchQuery}"` : 'Nothing here yet'}</h3>
        <p>{searchQuery ? 'Try a different search term.' : 'Be the first to create a pin!'}</p>
      </div>
    );
  }

  return (
    <div className="home-feed">
      <MasonryGrid>
        {pins.map(pin => (
          <PinCard
            key={pin._id}
            pin={pin}
            currentUser={currentUser}
            onOpen={() => onOpenPin(pin._id)}
            onUserClick={onOpenUser}
            onLikeToggle={handleLikeToggle}
          />
        ))}
      </MasonryGrid>

      {hasMore && !searchQuery && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <button
            className="btn-secondary"
            onClick={() => fetchPins(false)}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <><div className="loading-spinner" style={{ width: 16, height: 16 }} /> Loading…</>
            ) : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
