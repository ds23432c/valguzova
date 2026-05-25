import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import './QuizPage.css';

const TYPE_LABELS = {
  classic: 'Классика', timed: 'На время', picture: 'С картинками',
  open: 'Открытый', learning: 'Обучающий', team: 'Командный'
};

// ═══ QUIZ DETAIL ═══════════════════════════════════════════════
export default function QuizPage() {
  const { uuid } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    api.get(`/quizzes/${uuid}`).then(r => setQuiz(r.data)).finally(() => setLoading(false));
    api.get(`/quizzes/${uuid}/leaderboard`).then(r => setLeaderboard(r.data || [])).catch(() => {});
  }, [uuid]);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!quiz) return <div className="page-loader"><h2 style={{color:'var(--text-white)'}}>Квиз не найден</h2></div>;

  if (playing) return <QuizPlayer quiz={quiz} onDone={() => { setPlaying(false); navigate(`/quiz/${uuid}/result`); }} />;

  const imgSrc = quiz.cover_image
    ? (quiz.cover_image.startsWith('http') ? quiz.cover_image : `${window.location.origin}${quiz.cover_image}`)
    : null;

  return (
    <div className="quiz-detail">
      <div className="container">
        <div className="quiz-detail-hero">
          <div className="quiz-detail-img">
            {imgSrc ? <img src={imgSrc} alt={quiz.title} /> : <div className="quiz-ph">{quiz.category_icon || '🎯'}</div>}
          </div>
          <div className="quiz-detail-info">
            <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:12}}>
              <span className="badge badge-purple">{TYPE_LABELS[quiz.quiz_type]}</span>
              <span className={`badge diff-${quiz.difficulty}`}>{quiz.difficulty === 'easy' ? 'Лёгкий' : quiz.difficulty === 'medium' ? 'Средний' : 'Сложный'}</span>
              {quiz.category_name && <span className="badge badge-teal">{quiz.category_icon} {quiz.category_name}</span>}
            </div>
            <h1 className="quiz-detail-title">{quiz.title}</h1>
            <p className="quiz-detail-desc">{quiz.description}</p>
            <div className="quiz-meta-grid">
              <div className="meta-item"><span className="meta-icon">📝</span><span className="meta-val">{quiz.questions?.length || 0}</span><span className="meta-lbl">вопросов</span></div>
              <div className="meta-item"><span className="meta-icon">▶</span><span className="meta-val">{(quiz.plays_count || 0).toLocaleString()}</span><span className="meta-lbl">прохождений</span></div>
              {quiz.time_limit && <div className="meta-item"><span className="meta-icon">⏱</span><span className="meta-val">{Math.floor(quiz.time_limit / 60)}</span><span className="meta-lbl">минут</span></div>}
              <div className="meta-item"><span className="meta-icon">🔄</span><span className="meta-val">{quiz.max_attempts}</span><span className="meta-lbl">попытки</span></div>
              <div className="meta-item"><span className="meta-icon">✅</span><span className="meta-val">{quiz.pass_score}%</span><span className="meta-lbl">для сдачи</span></div>
            </div>
            <div className="quiz-author">
              <div className="author-ava">{quiz.author_name?.[0]?.toUpperCase()}</div>
              <div><p style={{fontSize:13, color:'var(--text-accent)', fontWeight:600}}>Автор</p><p style={{fontWeight:700, color:'var(--text-white)'}}>@{quiz.author_name}</p></div>
            </div>
            {user
              ? <button className="btn btn-primary btn-lg" onClick={() => setPlaying(true)}>Начать квиз →</button>
              : <div style={{display:'flex', flexDirection:'column', gap:10}}>
                  <Link to="/login" className="btn btn-primary btn-lg" style={{justifyContent:'center'}}>Войти для прохождения</Link>
                  <p style={{fontSize:13, color:'var(--text-secondary)', textAlign:'center'}}>Нужен аккаунт для сохранения результатов</p>
                </div>
            }
            {quiz.shuffle_questions && <p className="shuffle-note">🔀 Вопросы перемешаны для честной проверки</p>}
          </div>
        </div>

        {leaderboard.length > 0 && (
          <div className="leaderboard">
            <h2 style={{fontSize:22, fontWeight:800, color:'var(--text-white)', marginBottom:16}}>🏆 Таблица лидеров</h2>
            <div className="lb-list">
              {leaderboard.map((row, i) => (
                <div key={i} className={`lb-row ${i < 3 ? 'lb-top' : ''}`}>
                  <span className="lb-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                  <div className="lb-user-ava">{row.username[0].toUpperCase()}</div>
                  <span className="lb-name">{row.username}</span>
                  <div className="lb-score-wrap">
                    <span className="lb-pct">{parseFloat(row.best_percent).toFixed(0)}%</span>
                    <span className="lb-time">{Math.floor(row.best_time / 60)}:{String(row.best_time % 60).padStart(2, '0')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ QUIZ PLAYER ════════════════════════════════════════════════
function QuizPlayer({ quiz, onDone }) {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(quiz.time_limit || null);
  const [violations, setViolations] = useState([]);
  const [warning, setWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const startTime = useRef(Date.now());

  const questions = quiz.questions || [];
  const q = questions[current];

  // ── ANTI-CHEAT ──────────────────────────────────────────────
  const addViolation = useCallback((type, description) => {
    setViolations(v => [...v, { type, description, ts: Date.now() }]);
    setWarning(`⚠️ Нарушение зафиксировано: ${description}`);
    setTimeout(() => setWarning(''), 4000);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) addViolation('tab_switch', 'Переключение вкладки браузера');
    };
    const onCopy = (e) => { e.preventDefault(); addViolation('copy_text', 'Попытка копирования текста'); };
    const onContext = (e) => { e.preventDefault(); addViolation('right_click', 'Нажатие правой кнопки мыши'); };
    const onKeydown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['c','v','u','s'].includes(e.key.toLowerCase())) {
        e.preventDefault(); addViolation('hotkey', `Горячая клавиша Ctrl+${e.key.toUpperCase()}`);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('copy', onCopy);
    document.addEventListener('contextmenu', onContext);
    document.addEventListener('keydown', onKeydown);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('contextmenu', onContext);
      document.removeEventListener('keydown', onKeydown);
    };
  }, [addViolation]);

  // ── TIMER ───────────────────────────────────────────────────
  useEffect(() => {
    if (!timeLeft) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setTimeLeft(tl => tl - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const handleAnswer = (answerId) => {
    setAnswers(a => ({ ...a, [q.id]: answerId }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
    try {
      const r = await api.post(`/quizzes/${uuid}/attempt`, { answers, time_spent: timeSpent, violations });
      setResult(r.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Ошибка отправки');
      setSubmitting(false);
    }
  };

  if (result) return <QuizResult result={result} quiz={quiz} answers={answers} onBack={() => navigate(`/quiz/${uuid}`)} />;

  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="quiz-player">
      {warning && <div className="violation-warning">{warning}</div>}

      <div className="player-top">
        <div className="player-progress-wrap">
          <div className="progress-bar-wrap" style={{flex:1}}>
            <div className="progress-bar-fill" style={{width:`${progress}%`}} />
          </div>
          <span className="player-counter">{current + 1} / {questions.length}</span>
        </div>
        {timeLeft !== null && (
          <div className={`player-timer ${timeLeft < 30 ? 'timer-danger' : ''}`}>
            ⏱ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        )}
        {violations.length > 0 && (
          <span className="badge badge-red" title="Зафиксированные нарушения">⚠️ {violations.length}</span>
        )}
      </div>

      <div className="player-card fade-in" key={current}>
        <div className="question-num">Вопрос {current + 1}</div>
        <h2 className="question-text">{q.text}</h2>
        {q.image && <img src={q.image.startsWith('http') ? q.image : `${window.location.origin}${q.image}`} className="question-img" alt="вопрос" />}

        <div className="answers-grid">
          {q.answers?.map(a => (
            <button
              key={a.id}
              className={`answer-btn ${answers[q.id] === a.id ? 'selected' : ''}`}
              onClick={() => handleAnswer(a.id)}
            >{a.text}</button>
          ))}
        </div>

        <div className="player-nav">
          <button className="btn btn-outline" onClick={() => setCurrent(c => c - 1)} disabled={current === 0}>← Назад</button>
          {current < questions.length - 1
            ? <button className="btn btn-primary" onClick={() => setCurrent(c => c + 1)}>Далее →</button>
            : <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Отправляем...' : '✅ Завершить'}
              </button>
          }
        </div>
      </div>
    </div>
  );
}

// ═══ QUIZ RESULT ════════════════════════════════════════════════
function QuizResult({ result, quiz, onBack }) {
  const pct = parseFloat(result.percent || 0);
  const emoji = pct === 100 ? '🏆' : pct >= 80 ? '🌟' : pct >= 60 ? '✅' : pct >= 40 ? '📚' : '😅';

  return (
    <div className="quiz-result">
      <div className="container" style={{maxWidth:680}}>
        <div className="result-card card fade-in">
          <div className="result-emoji">{emoji}</div>
          <h1 className="result-title">{result.isPassed ? 'Тест сдан!' : 'Попробуй ещё раз'}</h1>
          <div className="result-score-circle">
            <svg viewBox="0 0 120 120" className="score-ring">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="url(#rg)" strokeWidth="8"
                strokeDasharray={`${pct * 3.14} 314`} strokeLinecap="round"
                transform="rotate(-90 60 60)" />
              <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#7C3AED"/><stop offset="100%" stopColor="#14B8A6"/></linearGradient></defs>
            </svg>
            <div className="score-text">
              <span className="score-pct">{pct.toFixed(0)}%</span>
              <span className="score-raw">{result.score}/{result.maxScore}</span>
            </div>
          </div>
          {result.violationsCount > 0 && (
            <div className="error-msg" style={{textAlign:'center'}}>⚠️ Зафиксировано нарушений: {result.violationsCount}</div>
          )}
          <div className="result-answers">
            <h3 style={{color:'var(--text-white)', marginBottom:12}}>Разбор ошибок</h3>
            {quiz.questions?.map(q => {
              const qAnswers = result.answers?.filter(a => a.question_id === q.id) || [];
              const correct = qAnswers.find(a => a.is_correct);
              return (
                <div key={q.id} className="result-question">
                  <p className="rq-text">{q.text}</p>
                  {correct && <p className="rq-correct">✅ {correct.text}</p>}
                  {correct?.explanation && <p className="rq-explain">{correct.explanation}</p>}
                </div>
              );
            })}
          </div>
          <div style={{display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center'}}>
            <button className="btn btn-outline" onClick={onBack}>← К квизу</button>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Попробовать снова</button>
          </div>
        </div>
      </div>
    </div>
  );
}
