// Quiz scoring (SPEC §9): same 5 questions before and after; learning gain = post − pre.
import type { Quiz } from '../data/types';
import type { QuizAnswers } from './store';

/** Correct answers, or null when the quiz was skipped / not taken. */
export function quizScore(answers: QuizAnswers, quiz: Quiz): number | null {
  if (!Array.isArray(answers)) return null;
  return quiz.questions.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
}

/** "x → y / 5 (+g)" when both quizzes were taken, else "—". */
export function quizSummary(q: { pre: QuizAnswers; post: QuizAnswers }, quiz: Quiz): string {
  const pre = quizScore(q.pre, quiz);
  const post = quizScore(q.post, quiz);
  if (pre === null || post === null) return '—';
  const g = post - pre;
  return `${pre} → ${post} / ${quiz.questions.length} (${g < 0 ? '−' : '+'}${Math.abs(g)})`;
}
