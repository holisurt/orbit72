// CP4.1 Quiz (SPEC §9): pre before Brief, post after Debrief, same 5 questions, skip → "—".
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { ReactElement } from 'react';
import { DataProvider } from '../src/data/context';
import { initialState, reducer, StoreProvider, type Action, type GameState } from '../src/state/store';
import { quizScore, quizSummary } from '../src/state/quiz';
import { Quiz } from '../src/screens/Quiz';
import { Debrief } from '../src/screens/Debrief';
import { data } from './fixtures';

const play = (s: GameState, ...a: Action[]) => a.reduce(reducer, s);
const render = (el: ReactElement, s: GameState) =>
  renderToString(
    <DataProvider initial={{ data, maps: { world: '', vn: '', globe: '', seaLand: '' } }}>
      <StoreProvider initial={s}>{el}</StoreProvider>
    </DataProvider>,
  ).replace(/<!-- -->/g, '');

const right = data.quiz.questions.map((q) => q.answer);
const wrong = data.quiz.questions.map((q) => (q.answer + 1) % q.options.length);

describe('quiz scoring', () => {
  it('quiz.json has 5 questions', () => expect(data.quiz.questions).toHaveLength(5));
  it('counts correct answers; skipped or missing → null', () => {
    expect(quizScore(right, data.quiz)).toBe(5);
    expect(quizScore(wrong, data.quiz)).toBe(0);
    expect(quizScore('skip', data.quiz)).toBeNull();
    expect(quizScore(null, data.quiz)).toBeNull();
  });
  it('summary "x → y / 5 (+gain)", "—" if either is skipped', () => {
    const two = [...right.slice(0, 2), ...wrong.slice(2)];
    expect(quizSummary({ pre: two, post: right }, data.quiz)).toBe('2 → 5 / 5 (+3)');
    expect(quizSummary({ pre: right, post: two }, data.quiz)).toBe('5 → 2 / 5 (−3)');
    expect(quizSummary({ pre: right, post: right }, data.quiz)).toBe('5 → 5 / 5 (+0)');
    expect(quizSummary({ pre: 'skip', post: right }, data.quiz)).toBe('—');
    expect(quizSummary({ pre: right, post: null }, data.quiz)).toBe('—');
  });
});

describe('quiz flow', () => {
  it('solo: Home → Quiz(pre) → Brief; a new mission resets the pair', () => {
    let s = play({ ...initialState, quiz: { pre: right, post: right } }, { type: 'startMission' });
    expect(s.screen).toBe('quiz_pre');
    expect(s.quiz).toEqual({ pre: null, post: null });
    s = play(s, { type: 'answerQuiz', phase: 'pre', answers: wrong });
    expect(s.screen).toBe('brief');
    expect(s.quiz.pre).toEqual(wrong);
  });

  it('co-op: Home → Setup first', () => {
    expect(play({ ...initialState, mode: 'coop' }, { type: 'startMission' }).screen).toBe('setup');
  });

  it('skip stores "skip" and moves on', () => {
    const s = play(initialState, { type: 'startMission' }, { type: 'answerQuiz', phase: 'pre', answers: 'skip' });
    expect(s).toMatchObject({ screen: 'brief', quiz: { pre: 'skip', post: null } });
  });

  it('post quiz returns to the screen that opened it', () => {
    const s = play(initialState, { type: 'openPostQuiz', next: 'debrief' });
    expect(s.screen).toBe('quiz_post');
    const done = play(s, { type: 'answerQuiz', phase: 'post', answers: right });
    expect(done).toMatchObject({ screen: 'debrief', quizNext: null, quiz: { post: right } });
    expect(play(initialState, { type: 'openPostQuiz', next: 'share' }, { type: 'answerQuiz', phase: 'post', answers: 'skip' }).screen).toBe('share');
  });

  it('Quiz screen: 5 questions as radio groups, skip + submit buttons, no name field', () => {
    const h = render(<Quiz phase="pre" />, play(initialState, { type: 'startMission' }));
    expect(h.match(/<fieldset/g)).toHaveLength(5);
    expect(h.match(/type="radio"/g)).toHaveLength(data.quiz.questions.reduce((n, q) => n + q.options.length, 0));
    expect(h).toContain('Skip');
    expect(h).toContain('Submit (0/5)');
    expect(h).not.toContain('type="text"');
  });
});

describe('Debrief shows the quiz result', () => {
  const launched = play(initialState, { type: 'startMission' }, { type: 'acceptContract' }, {
    type: 'launch',
    record: { launchedWithVuot: false, launchedWithNoGo: false, unanimousGo: true },
  }, { type: 'finishOps' });

  it('both taken: panel + spec sheet row show "x → y / 5 (+gain)"', () => {
    const s = { ...launched, quiz: { pre: [...right.slice(0, 3), ...wrong.slice(3)], post: right } };
    const h = render(<Debrief />, s);
    expect(h).toContain('Quiz before → after: <strong class="mono">3 → 5 / 5 (+2)</strong>');
    expect(h).toMatch(/Quiz before → after<\/text><text[^>]*>3 → 5 \/ 5 \(\+2\)</); // exported spec sheet row
    expect(h).toContain('Make mission patch · Share →');
  });

  it('post not taken yet: "—", CTA goes through the post quiz', () => {
    const h = render(<Debrief />, { ...launched, quiz: { pre: right, post: null } });
    expect(h).toContain('Quiz before → after: <strong class="mono">—</strong>');
    expect(h).toContain('Take the quiz again');
    expect(h).toContain('Quiz again · Mission patch →');
  });

  it('skipped: "—" and no re-ask', () => {
    const h = render(<Debrief />, { ...launched, quiz: { pre: 'skip', post: 'skip' } });
    expect(h).toContain('Quiz before → after: <strong class="mono">—</strong>');
    expect(h).not.toContain('Take the quiz again');
  });
});
