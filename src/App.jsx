import { Routes, Route } from 'react-router-dom';

import DemonList from './pages/DemonList'
import Auth from './pages/Auth';
import Level from './pages/Level'
import Leaderboard from './pages/Leaderboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DemonList />} />
      <Route path="/list" element={<DemonList />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/level/:position" element={<Level/>}/>
    </Routes>
  );
}

export default App;
