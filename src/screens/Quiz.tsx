import { useState } from 'react';
import { useGameData } from '../data/context';
import { quizScore } from '../state/quiz';
import { useStore, type QuizPhase } from '../state/store';
import { TopBar } from '../ui/TopBar';
import { useT } from '../ui/i18n';

/**
 * Quiz before Brief (pre) and after Debrief (post), same questions (SPEC §9). Answers are stored only as
 * option indices in localStorage — no names or other personal data. Skipping is allowed (shown as "—").
 */
export function Quiz({ phase }: { phase: QuizPhase }) {
  const { quiz } = useGameData();
  const { state, dispatch } = useStore();
  const t = useT();
  const qs = quiz.questions;
  const [answers, setAnswers] = useState<(number | null)[]>(() => qs.map(() => null));
  const [review, setReview] = useState(false);
  const complete = answers.every((a) => a !== null);
  const pre = quizScore(state.quiz.pre, quiz);

  const submit = () => {
    if (!complete) return;
    if (phase === 'pre') dispatch({ type: 'answerQuiz', phase, answers: answers as number[] });
    else setReview(true);
  };
  const score = review ? quizScore(answers as number[], quiz) : null;

  return (
    <div className="screen">
      <TopBar subtitle={phase === 'pre' ? 'Quiz trước nhiệm vụ' : 'Quiz sau nhiệm vụ'} />
      <main className="body quiz-body">
        <div className="col" style={{ gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 'calc(24rem / 16)', fontWeight: 800 }}>
            {phase === 'pre' ? '5 câu hỏi nhanh trước khi nhận hợp đồng' : 'Cùng 5 câu hỏi — bạn đã học được gì?'}
          </h1>
          <p style={{ margin: 0, fontSize: 'calc(14rem / 16)', color: 'var(--soft)' }}>
            {phase === 'pre'
              ? 'Không tính điểm sao. Đáp án sẽ hiện sau nhiệm vụ, khi bạn làm lại đúng các câu này.'
              : 'So sánh với lần trước để thấy mức tiến bộ. Chỉ lưu đáp án trên máy này, không lưu tên.'}
          </p>
        </div>

        {qs.map((q, i) => (
          <fieldset key={i} className="panel quiz-q">
            <legend className="quiz-legend">
              <span className="mono" style={{ color: 'var(--amber)' }}>
                {i + 1}/{qs.length}
              </span>{' '}
              {q.q}
            </legend>
            {q.options.map((o, k) => {
              const picked = answers[i] === k;
              const mark = review ? (k === q.answer ? 'ĐÚNG' : picked ? 'SAI' : '') : '';
              return (
                <label key={k} className={`quiz-opt${picked ? ' picked' : ''}${review && k === q.answer ? ' right' : ''}`}>
                  <input
                    type="radio"
                    name={`q${i}`}
                    checked={picked}
                    disabled={review}
                    onChange={() => setAnswers((a) => a.map((x, j) => (j === i ? k : x)))}
                  />
                  <span style={{ flex: 1 }}>{o}</span>
                  {mark && <span className={`status ${mark === 'ĐÚNG' ? 'DAT' : 'VUOT'}`}>{mark}</span>}
                </label>
              );
            })}
          </fieldset>
        ))}

        {review && score !== null ? (
          <div className="panel col" style={{ padding: 14, gap: 8 }} role="status">
            <span className="lbl" style={{ color: 'var(--amber)' }}>
              Kết quả
            </span>
            <span style={{ fontSize: 'calc(20rem / 16)', fontWeight: 800 }}>
              {pre !== null ? `Quiz trước → sau: ${pre} → ${score} / ${qs.length} (${score - pre < 0 ? '−' : '+'}${Math.abs(score - pre)})` : `Quiz sau: ${score} / ${qs.length}`}
            </span>
            <button className="btn-p" onClick={() => dispatch({ type: 'answerQuiz', phase, answers: answers as number[] })}>
              {t('continue')} →
            </button>
          </div>
        ) : (
          <div className="row" style={{ gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button className="btn-s" onClick={() => dispatch({ type: 'answerQuiz', phase, answers: 'skip' })}>
              {t('skip')}
            </button>
            <button className="btn-p" aria-disabled={!complete} onClick={submit}>
              {complete ? t('submit') : `${t('submit')} (${answers.filter((a) => a !== null).length}/${qs.length})`}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
