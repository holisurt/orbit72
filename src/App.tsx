export const APP_TITLE = 'ORBIT 72 - Bắt Sóng Cứu Hộ';

export function App() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        textAlign: 'center',
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 800 }}>
          <span style={{ color: 'var(--amber)' }}>ORBIT 72</span> - Bắt Sóng Cứu Hộ
        </h1>
        <p className="mono" style={{ color: 'var(--muted)', marginTop: 12 }}>
          Đang xây dựng…
        </p>
      </div>
    </main>
  );
}
