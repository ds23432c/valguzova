import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import './Profile.css';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: user?.username || '', bio: user?.bio || '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    api.get('/user/history').then(r => setHistory(r.data || [])).catch(() => {});
  }, []);

  const handleAvatarChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('username', form.username);
      fd.append('bio', form.bio);
      if (avatarFile) fd.append('avatar', avatarFile);
      const r = await api.put('/auth/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUser(r.data);
      localStorage.setItem('kvizoria_user', JSON.stringify(r.data));
      setMsg('Профиль сохранён!');
      setEditing(false);
      setAvatarFile(null);
    } catch (err) { setMsg(err.response?.data?.message || 'Ошибка сохранения'); }
    finally { setSaving(false); }
  };

  const avatarSrc = avatarPreview || (user?.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `${window.location.origin}${user.avatar}`)
    : null);

  const totalPct = history.length ? (history.reduce((s, h) => s + parseFloat(h.percent_score || 0), 0) / history.length).toFixed(1) : 0;
  const passed = history.filter(h => h.is_passed).length;

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-grid">
          {/* Sidebar */}
          <div className="profile-sidebar">
            <div className="card profile-card">
              <div className="profile-avatar-wrap" onClick={() => editing && fileRef.current?.click()} style={{cursor: editing ? 'pointer' : 'default'}}>
                {avatarSrc
                  ? <img src={avatarSrc} alt={user?.username} className="profile-avatar-img" />
                  : <div className="profile-avatar-ph">{user?.username?.[0]?.toUpperCase()}</div>
                }
                {editing && <div className="avatar-overlay">📷 Сменить фото</div>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatarChange} />

              {editing ? (
                <form onSubmit={handleSave} className="profile-edit-form">
                  <div className="form-group">
                    <label className="label">Имя пользователя</label>
                    <input className="input" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="label">О себе</label>
                    <textarea className="input" rows={3} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} />
                  </div>
                  {msg && <div className={msg.includes('!') ? 'success-msg' : 'error-msg'}>{msg}</div>}
                  <div style={{display:'flex', gap:8}}>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? '...' : 'Сохранить'}</button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Отмена</button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="profile-name">{user?.username}</h2>
                  <p className="profile-email">{user?.email}</p>
                  {user?.bio && <p className="profile-bio">{user.bio}</p>}
                  <div className="profile-role">
                    <span className={`badge badge-${user?.role === 'admin' ? 'pink' : user?.role === 'creator' ? 'teal' : 'purple'}`}>
                      {user?.role === 'admin' ? '⚙️ Администратор' : user?.role === 'creator' ? '✏️ Создатель' : '🎮 Участник'}
                    </span>
                  </div>
                  {msg && <div className="success-msg">{msg}</div>}
                  <button className="btn btn-outline btn-sm" style={{width:'100%', justifyContent:'center', marginTop:12}} onClick={() => setEditing(true)}>
                    ✏️ Редактировать профиль
                  </button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="card stats-card">
              <h3 className="stats-title">Статистика</h3>
              <div className="stats-grid">
                <div className="stat-item"><span className="stat-val">{history.length}</span><span className="stat-lbl">квизов пройдено</span></div>
                <div className="stat-item"><span className="stat-val">{passed}</span><span className="stat-lbl">сдано</span></div>
                <div className="stat-item"><span className="stat-val">{totalPct}%</span><span className="stat-lbl">средний балл</span></div>
                <div className="stat-item"><span className="stat-val">{history.length - passed}</span><span className="stat-lbl">не сдано</span></div>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="profile-content">
            <h2 className="section-title">История прохождений</h2>
            {history.length === 0
              ? <div className="empty-state">
                  <div style={{fontSize:40}}>📋</div>
                  <p style={{color:'var(--text-secondary)'}}>Ты ещё не проходил квизы</p>
                </div>
              : <div className="history-list">
                  {history.map((h, i) => {
                    const pct = parseFloat(h.percent_score || 0);
                    return (
                      <div key={i} className="history-item card">
                        <div className="history-cover">
                          {h.cover_image
                            ? <img src={h.cover_image.startsWith('http') ? h.cover_image : `${window.location.origin}${h.cover_image}`} alt={h.title} />
                            : <div className="history-cover-ph">🎯</div>
                          }
                        </div>
                        <div className="history-info">
                          <h4 className="history-title">{h.title}</h4>
                          <p className="history-date">{new Date(h.completed_at).toLocaleDateString('ru', {day:'numeric', month:'long', year:'numeric'})}</p>
                        </div>
                        <div className="history-result">
                          <span className={`history-pct ${pct >= 60 ? 'pct-pass' : 'pct-fail'}`}>{pct.toFixed(0)}%</span>
                          <span className={`badge ${h.is_passed ? 'badge-green' : 'badge-red'}`}>{h.is_passed ? 'Сдан' : 'Не сдан'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
