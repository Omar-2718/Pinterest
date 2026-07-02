import { useState, useEffect, useCallback } from 'react';
import { api, getAccessToken, setAccessToken } from './services/api';
import type { User } from './services/api';
import Auth from './pages/Auth';
import HomeFeed from './pages/HomeFeed';
import Profile from './pages/Profile';
import PinDetail from './pages/PinDetail';
import CreatePin from './pages/CreatePin';
import UserProfile from './pages/UserProfile';
import BoardDetail from './pages/BoardDetail';
import DevPanel from './components/DevPanel';
import { Home, PlusSquare, Search, LogOut, X } from 'lucide-react';

type Page =
  | { name: 'home' }
  | { name: 'pin'; id: string }
  | { name: 'profile' }
  | { name: 'create' }
  | { name: 'user'; userId: string; userName: string; userAvatar: string }
  | { name: 'board'; id: string };

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage]               = useState<Page>({ name: 'home' });
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Session restore on mount
  useEffect(() => {
    const tryRestore = async () => {
      const stored = getAccessToken();
      if (stored) {
        try {
          const res = await api.auth.getMe();
          setCurrentUser(res.data.user);
        } catch {
          try {
            const r = await api.auth.refresh();
            setAccessToken(r.accessToken);
            const res = await api.auth.getMe();
            setCurrentUser(res.data.user);
          } catch {
            setAccessToken(null);
          }
        }
      } else {
        try {
          const r = await api.auth.refresh();
          setAccessToken(r.accessToken);
          const res = await api.auth.getMe();
          setCurrentUser(res.data.user);
        } catch { /* no session */ }
      }
      setLoading(false);
    };
    tryRestore();
  }, []);

  const handleLogin = useCallback((user: User, accessToken: string) => {
    setAccessToken(accessToken);
    setCurrentUser(user);
  }, []);

  const handleLogout = useCallback(() => {
    api.auth.logout();
    setCurrentUser(null);
    setPage({ name: 'home' });
  }, []);

  const openPin = useCallback((id: string) => setPage({ name: 'pin', id }), []);

  /** Navigate to another user's profile page */
  const openUser = useCallback((userId: string, userName: string, userAvatar: string) => {
    setPage({ name: 'user', userId, userName, userAvatar });
  }, []);

  const openBoard = useCallback((boardId: string) => {
    setPage({ name: 'board', id: boardId });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
    setPage({ name: 'home' });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchInput('');
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (page.name) {
      case 'home':
        return (
          <HomeFeed
            onOpenPin={openPin}
            onOpenUser={openUser}
            searchQuery={searchQuery}
            currentUser={currentUser}
          />
        );
      case 'pin':
        return (
          <PinDetail
            pinId={page.id}
            onBack={() => setPage({ name: 'home' })}
            currentUser={currentUser}
            onOpenUser={openUser}
          />
        );
      case 'profile':
        return (
          <Profile
            currentUser={currentUser}
            onOpenPin={openPin}
            onOpenUser={openUser}
            onUserUpdate={setCurrentUser}
            onOpenBoard={openBoard}
          />
        );

      case 'create':
        return (
          <CreatePin
            onBack={() => setPage({ name: 'home' })}
            onPinCreated={() => setPage({ name: 'home' })}
          />
        );
      case 'user':
        return (
          <UserProfile
            userId={page.userId}
            userName={page.userName}
            userAvatar={page.userAvatar}
            currentUser={currentUser}
            onBack={() => setPage({ name: 'home' })}
            onOpenPin={openPin}
            onCurrentUserUpdate={setCurrentUser}
          />
        );
      case 'board':
        return (
          <BoardDetail
            boardId={page.id}
            onBack={() => setPage({ name: 'profile' })}
            currentUser={currentUser}
            onOpenPin={openPin}
            onOpenUser={openUser}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="navbar-left">
          <button className="navbar-logo" onClick={() => { setPage({ name: 'home' }); clearSearch(); }}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="#e60023">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
            </svg>
            <span className="logo-text">Pinterest</span>
          </button>
        </div>

        <div className="navbar-center">
          <button
            className={`nav-pill ${page.name === 'home' ? 'active' : ''}`}
            onClick={() => { setPage({ name: 'home' }); clearSearch(); }}
          >
            <Home size={18} /> Home
          </button>

          <form className="search-bar-form" onSubmit={handleSearch}>
            <Search size={16} className="search-bar-icon" />
            <input
              className="search-bar-input"
              type="text"
              placeholder="Search pins…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button type="button" className="search-clear-btn" onClick={clearSearch}>
                <X size={14} />
              </button>
            )}
          </form>
        </div>

        <div className="navbar-right">
          <button className="nav-icon-btn" onClick={() => setPage({ name: 'create' })} title="Create Pin">
            <PlusSquare size={22} />
          </button>

          <button
            className={`nav-avatar-btn ${page.name === 'profile' ? 'active' : ''}`}
            onClick={() => setPage({ name: 'profile' })}
            title="My Profile"
          >
            <AvatarImg user={currentUser} size={36} />
          </button>

          <button className="nav-icon-btn" onClick={handleLogout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {searchQuery && (
        <div className="search-banner">
          Results for <strong>"{searchQuery}"</strong>
          <button onClick={clearSearch}><X size={14} /></button>
        </div>
      )}

      <main className="main-content">
        {renderPage()}
      </main>

      <DevPanel />
    </div>
  );
}

/** Shared avatar component — initials fallback */
export function AvatarImg({ user, size = 40 }: { user: User; size?: number }) {
  const [err, setErr] = useState(false);
  const isDefault = !user.avatar || user.avatar === 'default.jpg';
  const src = isDefault ? null : user.avatar;

  if (!src || err) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e60023, #ad081b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
          fontSize: size * 0.38,
          flexShrink: 0,
        }}
      >
        {user.name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={user.name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      onError={() => setErr(true)}
    />
  );
}
