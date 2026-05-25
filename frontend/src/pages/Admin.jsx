import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import './Admin.css';

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState({});
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  if (user?.role !== 'admin') return <Navigate to="/" />;

  const load = async (section) => {
    setLoading(true);
    try {
      if (section === 'dashboard') { const r = await api.get('/admin/dashboard'); setData(r.data); }
      if (section === 'users') { const r = await api.get('/admin/users'); setUsers(r.data || []); }
      if (section === 'quizzes') { const r = await api.get('/admin/quizzes'); setQuizzes(r.data || []); }
      if (section === 'violations') { const r = await api.get('/admin/violations'); setViolations(r.data || []); }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(tab); }, [tab]);

  const toggleUser = async (id, field, val) => {
    await api.put(`/admin/users/${id}`, { [field]: val });
    setUsers(u => u.map(x => x.id === id ? {...x, [field]: val} : x));
  };

  const toggleQuiz = async (id) => {
    await api.put(`/admin/quizzes/${id}/toggle`);
    setQuizzes(q => q.map(x => x.id === id ? {...x, is_published: x.is_published ? 0 : 1} : x));
  };

  const deleteQuiz = async (id) => {
    if (!window.confirm('Удалить квиз?')) return;
    await api.delete(`/admin/quizzes/${id}`);
    setQuizzes(q => q.filter(x => x.id !== id));
  };

  const TABS = [
    { key: 'dashboard', label: '📊 Дашборд' },
    { key: 'users', label: '👥 Пользователи' },
    { key: 'quizzes', label: '📝 Квизы' },
    { key: 'violations', label: '⚠️ Нарушения' },
  ];

  const VIOLATION_LABELS = {
    tab_switch: 'Смена вкладки', copy_text: 'Копирование', right_click: 'ПКМ',
    hotkey: 'Горячая клавиша', time_exceeded: 'Превышение времени'
  };

  return (
    <div className="admin-page">
      <div className="admin-sidebar">
        <div className="admin-logo">⚡ <span className="gradient-text">Квизория</span></div>
        <nav className="admin-nav">
          {TABS.map(t => (
            <button key={t.key} className={`admin-nav-item ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="admin-main">
        <div className="admin-topbar">
          <h1 className="admin-page-title">{TABS.find(t => t.key === tab)?.label}</h1>
          <span className="badge badge-pink">Администратор</span>
        </div>

        {loading ? <div className="page-loader"><div className="spinner" /></div> : (

          <>
            {/* ── DASHBOARD ── */}
            {tab === 'dashboard' && (
              <div className="dashboard-content fade-in">
                <div className="admin-stats-grid">
                  {[
                    { label: 'Пользователей', val: data.stats?.users, icon: '👥', color: 'purple' },
                    { label: 'Квизов', val: data.stats?.quizzes, icon: '📝', color: 'teal' },
                    { label: 'Прохождений', val: data.stats?.attempts, icon: '▶', color: 'amber' },
                    { label: 'Нарушений', val: data.stats?.violations, icon: '⚠️', color: 'red' },
                  ].map((s, i) => (
                    <div key={i} className={`admin-stat-card asc-${s.color}`}>
                      <div className="asc-icon">{s.icon}</div>
                      <div className="asc-val">{s.val ?? 0}</div>
                      <div className="asc-lbl">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="dashboard-grid">
                  <div className="card">
                    <h3 className="card-title">Новые пользователи</h3>
                    {data.recentUsers?.map(u => (
                      <div key={u.id} className="dash-row">
                        <div className="dash-ava">{u.username[0].toUpperCase()}</div>
                        <div>
                          <p style={{fontWeight:600, color:'var(--text-white)', fontSize:14}}>{u.username}</p>
                          <p style={{fontSize:12, color:'var(--text-accent)'}}>{u.email}</p>
                        </div>
                        <span className={`badge badge-${u.role === 'admin' ? 'pink' : u.role === 'creator' ? 'teal' : 'purple'} ml-auto`}>{u.role}</span>
                      </div>
                    ))}
                  </div>
                  <div className="card">
                    <h3 className="card-title">Топ квизов</h3>
                    {data.topQuizzes?.map((q, i) => (
                      <div key={q.uuid} className="dash-row">
                        <span style={{fontSize:18, minWidth:24}}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                        <p style={{flex:1, fontWeight:600, color:'var(--text-white)', fontSize:14}}>{q.title}</p>
                        <span style={{color:'var(--text-accent)', fontSize:13}}>{q.plays_count?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── USERS ── */}
            {tab === 'users' && (
              <div className="fade-in">
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Пользователь</th>
                        <th>Email</th>
                        <th>Роль</th>
                        <th>Статус</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td style={{fontWeight:600, color:'var(--text-white)'}}>{u.username}</td>
                          <td style={{color:'var(--text-accent)'}}>{u.email}</td>
                          <td>
                            <select className="admin-select" value={u.role} onChange={e => toggleUser(u.id, 'role', e.target.value)}>
                              <option value="user">Участник</option>
                              <option value="creator">Создатель</option>
                              <option value="admin">Администратор</option>
                            </select>
                          </td>
                          <td>
                            <span className={`badge ${u.is_blocked ? 'badge-red' : 'badge-green'}`}>
                              {u.is_blocked ? 'Заблокирован' : 'Активен'}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`btn btn-sm ${u.is_blocked ? 'btn-outline' : 'btn-danger'}`}
                              onClick={() => toggleUser(u.id, 'is_blocked', !u.is_blocked)}
                            >{u.is_blocked ? '🔓 Разблокировать' : '🔒 Заблокировать'}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── QUIZZES ── */}
            {tab === 'quizzes' && (
              <div className="fade-in">
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Название</th><th>Автор</th><th>Тип</th><th>Прохождений</th><th>Статус</th><th>Действия</th></tr>
                    </thead>
                    <tbody>
                      {quizzes.map(q => (
                        <tr key={q.id}>
                          <td style={{fontWeight:600, color:'var(--text-white)', maxWidth:220}}>{q.title}</td>
                          <td style={{color:'var(--text-accent)'}}>@{q.author}</td>
                          <td><span className="type-label">{q.quiz_type}</span></td>
                          <td style={{color:'var(--text-primary)'}}>{(q.plays_count||0).toLocaleString()}</td>
                          <td><span className={`badge ${q.is_published ? 'badge-green' : 'badge-amber'}`}>{q.is_published ? 'Опубликован' : 'Черновик'}</span></td>
                          <td style={{display:'flex', gap:8}}>
                            <button className="btn btn-outline btn-sm" onClick={() => toggleQuiz(q.id)}>
                              {q.is_published ? '↙ Снять' : '↑ Опубл.'}
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteQuiz(q.id)}>🗑</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── VIOLATIONS ── */}
            {tab === 'violations' && (
              <div className="fade-in">
                {violations.length === 0
                  ? <div className="empty-state"><div style={{fontSize:40}}>✅</div><p style={{color:'var(--text-secondary)'}}>Нарушений не зафиксировано</p></div>
                  : <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr><th>Пользователь</th><th>Квиз</th><th>Нарушение</th><th>Описание</th><th>Дата</th></tr>
                        </thead>
                        <tbody>
                          {violations.map(v => (
                            <tr key={v.id}>
                              <td style={{fontWeight:600, color:'var(--text-white)'}}>{v.username}</td>
                              <td style={{color:'var(--text-accent)'}}>{v.quiz_title}</td>
                              <td><span className="badge badge-red">{VIOLATION_LABELS[v.violation_type] || v.violation_type}</span></td>
                              <td style={{color:'var(--text-secondary)', fontSize:13}}>{v.description || '—'}</td>
                              <td style={{color:'var(--text-accent)', fontSize:12}}>{new Date(v.created_at).toLocaleString('ru')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                }
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
