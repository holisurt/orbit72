import { useEffect, useState } from 'react';
import { ROLES, ROLE_GROUPS, dealCards } from '../state/roles';
import { useStore, type PlayerCount } from '../state/store';
import { PassScreen } from '../ui/PassScreen';
import { TopBar } from '../ui/TopBar';

const COUNTS: PlayerCount[] = [2, 3, 4];

export function Setup() {
  const { state, dispatch } = useStore();
  const { count, names, cards } = state.players;
  const groups = ROLE_GROUPS[count];
  const [open, setOpen] = useState<boolean[]>([false, false, false, false]);
  const [pass, setPass] = useState(false);

  // Deal secret priority cards (random a/b per role, SPEC §8) once per player count.
  useEffect(() => {
    if (!cards) dispatch({ type: 'dealCards', cards: dealCards() });
  }, [cards, dispatch]);

  return (
    <div className="screen">
      <TopBar
        subtitle="Thiết lập phòng điều khiển"
        right={
          <button className="link-btn" onClick={() => dispatch({ type: 'go', screen: 'home' })}>
            ← Trang chủ
          </button>
        }
      />
      <main className="body setup-body">
        <div className="col" style={{ gap: 12 }}>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }} role="group" aria-label="Số người chơi">
            <span className="lbl">Số người chơi</span>
            {COUNTS.map((n) => (
              <button
                key={n}
                className="seg"
                style={{ minWidth: 56, fontSize: 15, fontWeight: 800 }}
                aria-pressed={count === n}
                onClick={() => {
                  setOpen([false, false, false, false]);
                  dispatch({ type: 'setPlayerCount', count: n });
                }}
              >
                {n}
              </button>
            ))}
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Chơi chung một máy, chuyền máy theo lượt</span>
          </div>
          <div className="players" style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }}>
            {groups.map((g, q) => {
              const col = ROLES[g[0]].color;
              return (
                <section key={q} className="panel player" style={{ borderTop: `4px solid ${col}` }} aria-label={`Người chơi ${q + 1}`}>
                  <div className="row" style={{ gap: 10 }}>
                    <div className="avatar" style={{ background: col }} aria-hidden="true">
                      {g.map((k) => ROLES[k].ab).join('+')}
                    </div>
                    <div>
                      <div className="lbl">Người chơi {q + 1}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.25 }}>
                        {g.map((k) => ROLES[k].name).join(' + ')}
                      </div>
                    </div>
                  </div>
                  <label className="lbl" htmlFor={`p${q}`}>
                    Biệt danh (không cần tên thật)
                  </label>
                  <input
                    id={`p${q}`}
                    type="text"
                    placeholder="Ví dụ: Sao Mai"
                    value={names[q] ?? ''}
                    autoComplete="off"
                    onChange={(e) => dispatch({ type: 'setPlayerName', index: q, name: e.target.value })}
                  />
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: '#C9D4E8' }}>
                    {g.map((k) => ROLES[k].duty).join(' ')}
                  </div>
                  <div className="subtle col" style={{ marginTop: 'auto', gap: 6 }}>
                    <span className="lbl" style={{ color: 'var(--amber)' }}>
                      Thẻ ưu tiên bí mật
                    </span>
                    <span style={{ fontSize: 13, lineHeight: 1.45 }} aria-live="polite">
                      {open[q] && cards ? g.map((k) => ROLES[k].cards[cards[k]]).join(' · ') : '▒▒▒▒▒▒▒▒ (đang úp)'}
                    </span>
                    <button
                      className="flip"
                      aria-pressed={open[q]}
                      onClick={() => setOpen((o) => o.map((v, i) => (i === q ? !v : v)))}
                    >
                      {open[q] ? 'Úp thẻ' : 'Lật thẻ (chỉ mình bạn xem)'}
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
        <aside className="panel col" style={{ padding: 16, gap: 12 }}>
          <span className="lbl">Luật chơi chung một máy</span>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: '#C9D4E8' }}>
            <li>Mỗi người lật thẻ ưu tiên khi không ai nhìn, rồi úp lại.</li>
            <li>Khi màn hình báo “Đến lượt …”, chuyền máy cho người giữ vai đó.</li>
            <li>Chỉ người giữ vai được thao tác; mọi người cùng nhìn HUD.</li>
            <li>Trước khi phóng: Go/No-Go, mỗi vai trả lời GO hoặc NO-GO.</li>
            <li>Tranh luận về số liệu, không tranh luận về người.</li>
          </ol>
          <div className="subtle" style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
            Đạt thẻ ưu tiên: +20 điểm sao 5 mỗi thẻ · Go/No-Go đồng thuận: +20.
          </div>
          <button className="btn-p ghost" onClick={() => setPass(true)}>
            Xem màn chuyền máy
          </button>
          <button className="btn-p" style={{ marginTop: 'auto' }} onClick={() => dispatch({ type: 'go', screen: state.quiz.pre === null ? 'quiz_pre' : 'brief' })}>
            Nhận hợp đồng →
          </button>
        </aside>
      </main>
      {pass && (
        <PassScreen
          role="QD"
          count={count}
          names={names}
          text="Những người khác đặt máy xuống. Bạn chọn độ nghiêng, độ cao, số mặt phẳng và tên lửa; HUD tổng vẫn hiện cho cả đội cùng xem."
          onStart={() => setPass(false)}
        />
      )}
    </div>
  );
}
