import { DataProvider } from './data/context';
import { StoreProvider, useStore } from './state/store';
import { Home } from './screens/Home';
import { Setup } from './screens/Setup';
import { Brief } from './screens/Brief';
import { Build } from './screens/Build';
import { Orbit } from './screens/Orbit';
import { Placeholder } from './screens/Placeholder';
import { Review } from './screens/Review';
import { Launch } from './screens/Launch';
import { Ops } from './screens/Ops';
import { Debrief } from './screens/Debrief';
import { Share } from './screens/Share';
import { Quiz } from './screens/Quiz';
import { Guide } from './screens/Guide';
import { SettingsProvider } from './state/settings';

export const APP_TITLE = 'ORBIT 72 - Bắt Sóng Cứu Hộ';

function Router() {
  const { state, dispatch } = useStore();
  switch (state.screen) {
    case 'home':
      return <Home />;
    case 'setup':
      return <Setup />;
    case 'quiz_pre':
      return <Quiz key="pre" phase="pre" />;
    case 'quiz_post':
      return <Quiz key="post" phase="post" />;
    case 'brief':
      return <Brief />;
    case 'build':
      return <Build />;
    case 'orbit':
      return <Orbit />;
    case 'guide':
      return <Guide key={state.guideTab} initialTab={state.guideTab} />;
    case 'review':
      return <Review />;
    case 'launch':
      return state.ops.launch ? <Launch /> : <Review />;
    case 'ops':
      return state.ops.launch ? <Ops /> : <Review />;
    case 'debrief':
      return state.ops.launch ? <Debrief /> : <Review />;
    case 'share':
      return state.ops.launch ? <Share /> : <Review />;
    default:
      return <Placeholder title="ORBIT 72" back={() => dispatch({ type: 'go', screen: 'home' })} />;
  }
}

export function App() {
  return (
    <SettingsProvider>
      <DataProvider>
        <StoreProvider>
          <Router />
        </StoreProvider>
      </DataProvider>
    </SettingsProvider>
  );
}
