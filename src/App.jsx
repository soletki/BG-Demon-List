import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import DemonList from './pages/DemonList'
import Auth from './pages/Auth';
import Level from './pages/Level'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/list" element={<DemonList />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/level/:position" element={<Level/>}/>
    </Routes>
  );
}

export default App;
