import { useState, useEffect } from 'react';
import { getApiLogs, clearApiLogs, subscribeToLogs } from '../services/api';
import type { ApiLog } from '../services/api';
import { Activity, X, Trash2, Terminal, ChevronDown, ChevronUp, Book } from 'lucide-react';

export default function DevPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'docs'>('logs');
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLogs(getApiLogs());
    const unsub = subscribeToLogs(setLogs);
    return () => { unsub(); };
  }, []);


  const methodClass = (m: string) => ({
    GET: 'badge-method-get',
    POST: 'badge-method-post',
    PATCH: 'badge-method-patch',
    DELETE: 'badge-method-delete',
  }[m] ?? 'badge-real');

  return (
    <>
      <button className="dev-toggle-trigger" onClick={() => setIsOpen(true)}>
        <span className="pulse-dot" />
        <Activity size={16} />
        API Inspector ({logs.length})
      </button>

      <div className={`dev-panel-drawer ${isOpen ? 'open' : ''}`}>
        <div className="dev-panel-header">
          <div className="dev-panel-title">
            <Terminal size={18} />
            Backend Inspector
          </div>
          <button className="dev-panel-close" onClick={() => setIsOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="dev-panel-tabs">
          <button
            className={`dev-panel-tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Network Logs ({logs.length})
          </button>
          <button
            className={`dev-panel-tab ${activeTab === 'docs' ? 'active' : ''}`}
            onClick={() => setActiveTab('docs')}
          >
            <Book size={12} style={{ display: 'inline', marginRight: 4 }} />
            API Docs
          </button>
        </div>

        <div className="dev-panel-body">

          {activeTab === 'logs' && (
            <>
              <div className="dev-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span>Real HTTP Traffic</span>
                <button
                  onClick={clearApiLogs}
                  style={{ background: 'none', color: 'var(--color-dev-error)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
                >
                  <Trash2 size={12} /> Clear
                </button>
              </div>

              {logs.length === 0 ? (
                <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '40px 0', fontSize: '0.85rem' }}>
                  No requests yet. Navigate the app to see traffic.
                </div>
              ) : (
                <div className="dev-log-list">
                  {logs.map(log => {
                    const ok = log.status && log.status >= 200 && log.status < 300;
                    const expanded = expandedId === log.id;
                    return (
                      <div key={log.id} className="dev-log-item">
                        <div className="dev-log-header" onClick={() => setExpandedId(expanded ? null : log.id)}>
                          <div className="dev-log-meta">
                            <span className={`badge ${methodClass(log.method)}`}>{log.method}</span>
                            <span className="dev-log-url">{log.url}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="dev-log-time">{log.timestamp}</span>
                            {log.durationMs !== undefined && (
                              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>{log.durationMs}ms</span>
                            )}
                            {log.status ? (
                              <span className={`dev-log-status ${ok ? 'success' : 'error'}`}>{log.status}</span>
                            ) : (
                              <span className="dev-log-status" style={{ color: '#aaa' }}>...</span>
                            )}
                            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </div>
                        </div>

                        {expanded && (
                          <div className="dev-log-detail">
                            {log.requestData !== undefined && (
                              <div className="dev-json-block">
                                <div className="dev-json-title">Request Body</div>
                                <pre className="dev-json-payload">
                                  {typeof log.requestData === 'object'
                                    ? JSON.stringify(log.requestData, null, 2)
                                    : String(log.requestData)}
                                </pre>
                              </div>
                            )}
                            {log.responseData !== undefined && (
                              <div className="dev-json-block">
                                <div className="dev-json-title">Response</div>
                                <pre className="dev-json-payload">
                                  {typeof log.responseData === 'object'
                                    ? JSON.stringify(log.responseData, null, 2)
                                    : String(log.responseData)}
                                </pre>
                              </div>
                            )}
                            {log.error && (
                              <div className="dev-json-block">
                                <div className="dev-json-title" style={{ color: 'var(--color-dev-error)' }}>Error</div>
                                <pre className="dev-json-payload" style={{ color: 'var(--color-dev-error)' }}>{log.error}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'docs' && (
            <div style={{ fontSize: '0.8rem', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 20 }}>

              <div>
                <h4 style={{ color: 'white', marginBottom: 6 }}>Auth — public</h4>
                <pre style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 4, color: '#60a5fa', overflowX: 'auto' }}>{`POST /api/v1/users/signup
  body: { name, email, password, avatar? }

POST /api/v1/users/login
  body: { email, password }

GET  /api/v1/users/refresh
  (uses httpOnly cookie — no body needed)`}
                </pre>
              </div>

              <div>
                <h4 style={{ color: 'white', marginBottom: 6 }}>Auth — protected (Bearer token)</h4>
                <pre style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 4, color: '#34d399', overflowX: 'auto' }}>{`GET    /api/v1/users/me
PATCH  /api/v1/users/updateMe
  body: multipart/form-data
  field "name", file "image"
DELETE /api/v1/users/deleteMe`}
                </pre>
              </div>

              <div>
                <h4 style={{ color: 'white', marginBottom: 6 }}>Social — protected</h4>
                <pre style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 4, color: '#a78bfa', overflowX: 'auto' }}>{`POST   /api/v1/users/:id/follow
DELETE /api/v1/users/:id/unfollow
GET    /api/v1/users/:id/followers
GET    /api/v1/users/:id/following`}
                </pre>
              </div>

              <div>
                <h4 style={{ color: 'white', marginBottom: 6 }}>Pins — public</h4>
                <pre style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 4, color: '#fbbf24', overflowX: 'auto' }}>{`GET /api/v1/pins
  query: ?page=&limit=
GET /api/v1/pins/search?query=
GET /api/v1/pins/:id`}
                </pre>
              </div>

              <div>
                <h4 style={{ color: 'white', marginBottom: 6 }}>Pins — protected</h4>
                <pre style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 4, color: '#34d399', overflowX: 'auto' }}>{`POST   /api/v1/pins
  body: { title, imageURL, description? }
PATCH  /api/v1/pins/:id
  body: { description? }
DELETE /api/v1/pins/:id

POST   /api/v1/pins/:id/like
DELETE /api/v1/pins/:id/like
POST   /api/v1/pins/:id/save
DELETE /api/v1/pins/:id/save`}
                </pre>
              </div>

              <div style={{ padding: 12, border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, color: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.05)' }}>
                <strong>Boards — routes mounted, controller in progress</strong><br />
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  Routes: GET /my-boards, POST /, GET /:id, PATCH /:id, DELETE /:id<br />
                  POST /:id/pins/:pinId, DELETE /:id/pins/:pinId
                </span>
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}
