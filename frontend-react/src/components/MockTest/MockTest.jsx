import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './MockTest.css';

export default function MockTest() {
    const { user } = useAuth();
    const [difficulty, setDifficulty] = useState('Medium');
    const [subject, setSubject] = useState('General Aptitude & Coding');
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [reviewData, setReviewData] = useState(null);
    const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds

    useEffect(() => {
        if (user?.student_id) {
            loadHistory();
        }
    }, [user]);

    // Timer Effect
    useEffect(() => {
        let timer;
        if (test && !showResults) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        calculateResults();
                        toast.error('Time is up! Test submitted automatically.');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [test, showResults]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const loadHistory = async () => {
        try {
            const data = await api.getTestHistory(user.student_id);
            setHistory(data);
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };

    const startTest = async () => {
        setLoading(true);
        try {
            const data = await api.generateTest(difficulty, subject, user?.student_id);
            setTest(data);
            setTimeLeft(data.questions.length * 60); // 1 minute per question
            setCurrentQuestion(0);
            setAnswers({});
            setShowResults(false);
            setScore(0);
            toast.success(`AI Test of ${data.questions.length} questions generated!`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate test. Make sure GROQ_API_KEY is configured.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (optionIndex) => {
        setAnswers({ ...answers, [currentQuestion]: optionIndex });
    };

    const nextQuestion = () => {
        if (currentQuestion < test.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            if (window.confirm('Are you sure you want to submit the test?')) {
                calculateResults();
            }
        }
    };

    const prevQuestion = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const endTestEarly = () => {
        if (window.confirm('Are you sure you want to end the test now? Your progress will be saved.')) {
            calculateResults();
        }
    };

    const calculateResults = async () => {
        let s = 0;
        test.questions.forEach((q, idx) => {
            if (answers[idx] === q.correct_answer) {
                s++;
            }
        });
        setScore(s);
        setShowResults(true);

        try {
            await api.saveTestResult({
                student_id: user.student_id,
                test_title: test.test_title,
                difficulty: test.difficulty,
                subject: test.subject,
                score: s,
                total_questions: test.questions.length,
                answers: answers,
                questions: test.questions
            });
            loadHistory();
            toast.success('Result saved to your history!');
        } catch (error) {
            console.error('Failed to save result:', error);
            toast.error('Test completed, but failed to save to history.');
        }
    };

    if (loading) return (
        <div className="loading-center">
            <div className="spinner" />
            <p style={{ marginTop: '1rem', color: '#94a3b8' }}>AI is crafting 20 high-quality questions for you...</p>
        </div>
    );

    if (showResults || reviewData) {
        const displayData = reviewData || {
            test_title: test?.test_title,
            questions: test?.questions,
            answers: answers,
            score: score
        };

        if (!displayData.questions || !Array.isArray(displayData.questions)) {
            return (
                <div className="test-container results-card">
                    <div className="results-header">
                        <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: '#fbbf24', marginBottom: '1rem' }} />
                        <h2>Review Unavailable</h2>
                        <p style={{ color: '#94a3b8' }}>This test result was recorded before the detailed review feature was added.</p>
                    </div>
                    <button className="btn-primary" onClick={() => { setReviewData(null); setShowResults(false); }} style={{ marginTop: '2rem' }}>
                        Back to Dashboard
                    </button>
                </div>
            );
        }

        return (
            <div className="test-container results-card">
                <div className="results-header">
                    <div className="trophy-wrap">
                        <i className={`fas ${reviewData ? 'fa-history' : 'fa-trophy'}`} />
                    </div>
                    <h2>{reviewData ? 'Test Review' : 'Test Completed!'}</h2>
                    <p className="score-display">Accuracy: <span>{((displayData.score / displayData.questions.length) * 100).toFixed(1)}%</span></p>
                    <div className="score-detail">{displayData.score} correct out of {displayData.questions.length}</div>
                </div>

                <div className="review-section">
                    <h3>Detailed Review</h3>
                    {displayData.questions.map((q, idx) => (
                        <div key={idx} className={`review-item ${displayData.answers?.[idx] === q.correct_answer ? 'correct' : 'incorrect'}`}>
                            <p className="q-text"><strong>Q{idx + 1}:</strong> {q.question}</p>
                            <div className="review-ans-grid">
                                <p className="your-answer"><i className={displayData.answers?.[idx] === q.correct_answer ? "fas fa-check" : "fas fa-times"} /> Your answer: {q.options?.[displayData.answers?.[idx]] || '<Skipped>'}</p>
                                {displayData.answers?.[idx] !== q.correct_answer && (
                                    <p className="correct-answer"><i className="fas fa-check-double" /> Correct: {q.options?.[q.correct_answer]}</p>
                                )}
                            </div>
                            {q.explanation && <p className="explanation"><strong>Insight:</strong> {q.explanation}</p>}
                        </div>
                    ))}
                </div>

                <button className="btn-primary" onClick={() => { setTest(null); setShowResults(false); setReviewData(null); }} style={{ marginTop: '2rem', padding: '1rem 3rem' }}>
                    {reviewData ? 'Back to Dashboard' : 'Finish & Back to Dashboard'}
                </button>
            </div>
        );
    }

    if (test) {
        const q = test.questions[currentQuestion];
        const progress = ((currentQuestion + 1) / test.questions.length) * 100;

        return (
            <div className="test-container">
                <div className="test-header">
                    <div className="test-meta-bar">
                        <div className="test-title-group">
                            <h2>{test.test_title}</h2>
                            <span className="q-counter">Question {currentQuestion + 1} of {test.questions.length}</span>
                        </div>
                        <div className={`test-timer ${timeLeft < 300 ? 'urgent' : ''}`}>
                            <i className="fas fa-clock" /> {formatTime(timeLeft)}
                        </div>
                        <button className="end-btn" onClick={endTestEarly}>
                            <i className="fas fa-power-off" /> End Test
                        </button>
                    </div>
                    <div className="progress-container">
                        <div className="progress-bar-wrap">
                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </div>

                <div className="question-card">
                    <p className="question-text">{q.question}</p>
                    <div className="options-grid">
                        {q.options.map((opt, idx) => (
                            <button
                                key={idx}
                                className={`option-btn ${answers[currentQuestion] === idx ? 'selected' : ''}`}
                                onClick={() => handleAnswer(idx)}
                            >
                                <span className="option-label">{String.fromCharCode(65 + idx)}</span>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="test-footer">
                    <button className="btn-secondary" onClick={prevQuestion} disabled={currentQuestion === 0}>
                        <i className="fas fa-arrow-left" /> Previous
                    </button>
                    <div className="question-nav">
                        {test.questions.map((_, idx) => (
                            <div
                                key={idx}
                                className={`nav-dot ${currentQuestion === idx ? 'active' : ''} ${answers[idx] !== undefined ? 'answered' : ''}`}
                                onClick={() => setCurrentQuestion(idx)}
                            />
                        ))}
                    </div>
                    <button className="btn-primary" onClick={nextQuestion}>
                        {currentQuestion === test.questions.length - 1 ? 'Submit Test' : 'Next Question'} <i className="fas fa-arrow-right" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="test-container">
            <div className="section-header">
                <h2 className="section-title"><i className="fas fa-microchip" /> Global AI Mock Portal</h2>
                <p className="section-subtitle">Adaptive evaluation calibrated for top-tier tech roles</p>
            </div>

            <div className="config-layout">
                <div className="config-card">
                    <div className="chart-title"><i className="fas fa-layer-group" /> Session Parameters</div>

                    <div className="form-group">
                        <label>Knowledge Domain</label>
                        <select value={subject} onChange={e => setSubject(e.target.value)} className="form-input">
                            <option>General Aptitude &amp; Coding</option>
                            <option>Data Structures &amp; Algorithms</option>
                            <option>Web Development (MERN)</option>
                            <option>Python &amp; Machine Learning</option>
                            <option>SQL &amp; Database Management</option>
                            <option>Operating Systems &amp; Networking</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Cognitive Difficulty</label>
                        <div className="difficulty-picker">
                            {['Easy', 'Medium', 'Hard'].map(d => (
                                <button
                                    key={d}
                                    className={`diff-btn ${difficulty === d ? 'active' : ''}`}
                                    onClick={() => setDifficulty(d)}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button className="btn-primary start-btn" onClick={startTest}>
                        <i className="fas fa-play" /> Initialize Adaptive Evaluation
                    </button>

                    <div className="info-card">
                        <i className="fas fa-shield-alt" />
                        <p>20 high-fidelity questions will be synthesized based on your selection. Total time: 20 minutes.</p>
                    </div>
                </div>

                <div className="history-panel chart-card">
                    <div className="chart-title"><i className="fas fa-fingerprint" /> Performance History</div>
                    <div className="history-list">
                        {history.length > 0 ? (
                            history.map((h, i) => (
                                <div key={i} className="history-item clickable" onClick={() => setReviewData(h)}>
                                    <div className="h-score">{h.score}/{h.total_questions}</div>
                                    <div className="h-info">
                                        <div className="h-title">{h.subject}</div>
                                        <div className="h-meta">{h.difficulty} • {new Date(h.completed_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="history-empty">No evaluation records found in the neural link.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
