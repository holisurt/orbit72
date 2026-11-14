import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadGameData, loadMaps } from './loaders';
import type { GameData, Maps } from './types';

const DataCtx = createContext<GameData | null>(null);
const MapsCtx = createContext<Maps | null>(null);

interface Props {
  children: ReactNode;
  /** Preloaded data (tests); skips fetching. */
  initial?: { data: GameData; maps: Maps | null };
}

export function DataProvider({ children, initial }: Props) {
  const [data, setData] = useState<GameData | null>(initial?.data ?? null);
  const [maps, setMaps] = useState<Maps | null>(initial?.maps ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) return;
    loadGameData().then(setData, (e: Error) => setError(e.message));
    loadMaps().then(setMaps, () => setMaps({ world: '', vn: '', globe: '', seaLand: '' }));
  }, [initial]);

  if (error)
    return (
      <main className="center-msg" role="alert">
        Không tải được dữ liệu trò chơi ({error}). Hãy tải lại trang.
      </main>
    );
  if (!data)
    return (
      <main className="center-msg" aria-busy="true">
        Đang tải dữ liệu…
      </main>
    );
  return (
    <DataCtx.Provider value={data}>
      <MapsCtx.Provider value={maps}>{children}</MapsCtx.Provider>
    </DataCtx.Provider>
  );
}

export function useGameData(): GameData {
  const d = useContext(DataCtx);
  if (!d) throw new Error('useGameData outside DataProvider');
  return d;
}

/** Map paths; null while still loading (maps render without land until then). */
export function useMaps(): Maps | null {
  return useContext(MapsCtx);
}
