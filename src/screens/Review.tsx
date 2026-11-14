import { useState } from 'react';
import { useGameData } from '../data/context';
import { hashSeed, mulberry32, simulateLaunches } from '../sim/launch';
import { STATUS_LABEL } from '../sim/mission';
import { useMission } from '../state/mission';
import { ROLES } from '../state/roles';
import { useStore, type RCode, type RoleId } from '../state/store';
import { fmt, missionOfDay } from '../ui/format';
import { PassScreen } from '../ui/PassScreen';
import { StatusChip } from '../ui/StatusChip';
import { TopBar } from '../ui/TopBar';
import { useT } from '../ui/i18n';

/** FD calls each station (SPEC §8). */
const CALLS: { call: string; role: RoleId }[] = [
  { call: 'POWER?', role: 'VT' },
  { call: 'SCIENCE?', role: 'KH' },
  { call: 'BUDGET?', role: 'FD' },
  { call: 'COMMS?', role: 'QD' },
];
const R_CODES: RCode[] = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'];

export function Review() {
  const data = useGameData();
  const { state, dispatch } = useStore();
  const t = useT();
  const m = useMission();
  const [pass, setPass] = useState(state.mode === 'coop');
  const { votes, reasons } = state.ops;

  const vuot = m.reqs.filter((r) => r.status === 'VUOT');
  const sat = m.reqs.filter((r) => r.status === 'SAT');
  const hardFail = m.reqs.filter((r) => r.hard && r.status === 'VUOT');
  const go = CALLS.filter((c) => votes[c.role] === 'go').length;
  const no = CALLS.filter((c) => votes[c.role] === 'no').length;
  const missingReason = CALLS.some((c) => votes[c.role] === 'no' && !reasons[c.role]);
  const complete = go + no === 4;

  const blockers: string[] = [];
  if (hardFail.length) blockers.push(`Ràng buộc cứng chưa đạt: ${hardFail.map((r) => r.id).join(', ')} — không thể ký hợp đồng phóng.`);
  if (!m.launch.compatible) blockers.push(`Tên lửa không tương thích: ${m.launch.reason}.`);
  if (!complete) blockers.push('Chờ đủ 4 câu trả lời GO / NO-GO.');
  if (missingReason) blockers.push('NO-GO cần ghi lý do (mã R).');
  const canLaunch = blockers.length === 0;

  const summary =
    go === 4
      ? { text: '4/4 GO — Đồng thuận. Sẵn sàng phóng.', color: 'var(--ok)' }
      : no
        ? { text: `${go}/4 GO · ${no} NO-GO — phóng lúc này bị trừ 10 điểm sao 4.`, color: 'var(--bad)' }
        : { text: `${go}/4 GO — đang chờ vai còn lại.`, color: 'var(--warn)' };

  const doLaunch = () => {
    if (!canLaunch) return;
    const rules = data.scenario.difficulty[state.difficulty];
    const l = m.launch;
    const out = simulateLaunches({
      launches: l.launches,
      planesPerLaunch: m.orbit.planes / l.launches,
      costPerLaunchKusd: l.costKusd / l.launches,
      failProb: rules.launchFail,
      budgetKusd: m.budgetKusd,
      costKusd: m.totalCostKusd,
      rng: mulberry32(hashSeed(`${missionOfDay()}-${state.run}-${state.difficulty}`)),
    });
    dispatch({
      type: 'launch',
      record: {
        ...out,
        launchedWithVuot: vuot.length > 0,
        launchedWithNoGo: no > 0,
        unanimousGo: go === 4,
      },
    });
  };

  return (
    <div className="screen">
      <TopBar
        subtitle={data.scenario.name}
        step="review"
        right={
          <span className="turn">
            Lượt: <strong>Flight Director</strong>
          </span>
        }
      />
      <main className="body review-body">
        <section className="panel col" style={{ padding: '14px 16px', gap: 4 }} aria-label="Flight Readiness">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap' }}>
            <span className="lbl">Flight Readiness · R1–R8</span>
            <span className="mono" style={{ fontSize: 'calc(11rem / 16)', color: 'var(--muted)' }}>
              {m.orbit.planes} MP × {m.orbit.perPlane} · {m.orbit.preset === 'sso' ? 'SSO' : `${fmt(m.inclDeg, 1)}°`} {m.orbit.hKm} km
            </span>
          </div>
          {m.reqs.map((r) => (
            <div key={r.id} className="ready-row">
              <span className="mono" style={{ fontSize: 'calc(12rem / 16)', color: 'var(--amber)', fontWeight: 600 }}>
                {r.id}
              </span>
              <span style={{ fontSize: 'calc(13rem / 16)' }}>{r.name}</span>
              <span className="mono" style={{ fontSize: 'calc(12rem / 16)', color: 'var(--soft)', textAlign: 'right' }}>
                {r.value} <span style={{ color: 'var(--muted)' }}>({r.limit})</span>
              </span>
              <StatusChip status={r.status} />
            </div>
          ))}
          <div
            style={{
              marginTop: 'auto',
              borderRadius: 12,
              background: vuot.length ? '#3A1518' : '#2A2310',
              border: `1px solid ${vuot.length ? '#7F2A30' : '#6B5320'}`,
              padding: '10px 12px',
              fontSize: 'calc(13rem / 16)',
              lineHeight: 1.5,
            }}
          >
            <span className="lbl" style={{ color: vuot.length ? 'var(--bad)' : 'var(--warn)' }}>
              Nút thắt cổ chai
            </span>
            <br />
            {vuot.length
              ? `${vuot.length} mục VƯỢT: ${vuot.map((r) => `${r.id} ${r.name.toLowerCase()} (${r.value})`).join('; ')}.`
              : sat.length
                ? `Không có mục VƯỢT. Sát nhất: ${sat.map((r) => `${r.id} ${r.name.toLowerCase()} ${r.value}`).join('; ')}.`
                : 'Không có mục VƯỢT hay SÁT — thiết kế còn dư địa ở mọi yêu cầu.'}
          </div>
        </section>

        <section
          className="panel review-pad"
          style={{ position: 'relative', overflow: 'hidden', background: 'radial-gradient(420px 360px at 50% 70%, #1B2A55, #0F1830)' }}
          aria-label="Bệ phóng"
        >
          <svg width="100%" height="100%" viewBox="0 0 300 420" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Tên lửa trên bệ phóng chờ lệnh">
            <path d="M0 380 H300 V420 H0Z" fill="#141F3A" />
            <path d="M70 380 V150 H84 V380 M70 200 H120 M70 260 H120 M70 320 H120" stroke="#3A4C78" strokeWidth="4" fill="none" />
            <path d="M150 60 C170 90 176 120 176 160 V330 H124 V160 C124 120 130 90 150 60Z" fill="#E8EEF8" />
            <path d="M124 300 L104 350 H124Z M176 300 L196 350 H176Z" fill="#F87171" />
            <rect x="124" y="200" width="52" height="10" fill="#F5A524" />
            <circle cx="150" cy="140" r="11" fill="#3DD6F5" stroke="#1E3A8A" strokeWidth="3" />
            <path d="M128 330 H172 L166 350 H134Z" fill="#5B6B8F" />
            <text x="150" y="250" textAnchor="middle" fontSize="10" fontWeight="800" fill="#1E3A8A" transform="rotate(-90 150 250)">
              RỒNG CON
            </text>
          </svg>
          <div style={{ position: 'absolute', top: 16, left: 0, right: 0, textAlign: 'center' }}>
            <div className="lbl" style={{ color: 'var(--amber)' }}>
              {canLaunch ? 'Sẵn sàng · chờ lệnh phóng' : 'Đếm ngược tạm dừng chờ poll'}
            </div>
            <div className="mono" style={{ fontSize: 'calc(44rem / 16)', fontWeight: 600, letterSpacing: '0.04em' }}>
              T−00:10
            </div>
          </div>
        </section>

        <section className="panel col" style={{ padding: '14px 16px', gap: 8 }} aria-label="Go/No-Go poll">
          <span className="lbl">Go/No-Go poll</span>
          {CALLS.map(({ call, role }) => {
            const r = ROLES[role];
            const v = votes[role];
            return (
              <div key={role} className="col" style={{ gap: 6, padding: '8px 0', borderBottom: '1px solid #1A2647' }}>
                <div className="row" style={{ gap: 10 }}>
                  <div className="avatar" style={{ width: 40, height: 40, background: r.color, fontSize: 'calc(13rem / 16)' }} aria-hidden="true">
                    {r.ab}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mono" style={{ fontSize: 'calc(14rem / 16)', fontWeight: 600 }}>
                      {call}
                    </div>
                    <div style={{ fontSize: 'calc(12rem / 16)', color: 'var(--muted)' }}>{r.name}</div>
                  </div>
                  <div className="row" style={{ gap: 6 }} role="group" aria-label={`${call} ${r.name}`}>
                    <button className="vote go" aria-pressed={v === 'go'} onClick={() => dispatch({ type: 'vote', role, vote: 'go' })}>
                      GO
                    </button>
                    <button className="vote no" aria-pressed={v === 'no'} onClick={() => dispatch({ type: 'vote', role, vote: 'no' })}>
                      NO-GO
                    </button>
                  </div>
                </div>
                {v === 'no' && (
                  <label className="row" style={{ gap: 8, fontSize: 'calc(12rem / 16)', color: 'var(--muted)', paddingLeft: 50 }}>
                    Lý do
                    <select
                      className="select"
                      value={reasons[role] ?? ''}
                      onChange={(e) => dispatch({ type: 'reason', role, code: e.target.value as RCode })}
                    >
                      <option value="" disabled>
                        chọn mã R…
                      </option>
                      {R_CODES.map((c) => {
                        const q = m.reqs.find((x) => x.id === c)!;
                        return (
                          <option key={c} value={c}>
                            {c} · {q.name} ({STATUS_LABEL[q.status]})
                          </option>
                        );
                      })}
                    </select>
                  </label>
                )}
              </div>
            );
          })}
          <div role="status" style={{ fontSize: 'calc(14rem / 16)', fontWeight: 700, color: summary.color, marginTop: 4 }}>
            {summary.text}
          </div>
          {blockers.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 'calc(12rem / 16)', color: 'var(--warn)', lineHeight: 1.5 }}>
              {blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
          {data.scenario.difficulty[state.difficulty].launchFail > 0 && (
            <span style={{ fontSize: 'calc(11rem / 16)', color: 'var(--dim)' }}>
              Giám đốc: mỗi chuyến có {Math.round(data.scenario.difficulty[state.difficulty].launchFail * 100)}% thất bại [GA].
            </span>
          )}
          <div className="row" style={{ marginTop: 'auto' }}>
            <button className="btn-s" aria-label={t('back')} onClick={() => dispatch({ type: 'go', screen: 'orbit' })}>
              ←
            </button>
            <button className="btn-p big" style={{ flex: 1 }} aria-disabled={!canLaunch} onClick={doLaunch}>
              {t('launch')}
            </button>
          </div>
        </section>
      </main>
      {pass && (
        <PassScreen
          role="FD"
          count={state.players.count}
          names={state.players.names}
          text="Flight Director gọi từng vai: POWER, SCIENCE, BUDGET, COMMS. Mỗi vai trả lời GO hoặc NO-GO; NO-GO phải nêu mã yêu cầu R."
          onStart={() => setPass(false)}
        />
      )}
    </div>
  );
}
