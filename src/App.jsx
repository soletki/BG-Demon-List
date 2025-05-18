import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import DemonList from './pages/DemonList'
import Auth from './pages/Auth';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/list" element={<DemonList />} />
      <Route path="/auth" element={<Auth />} />
    </Routes>
  );
}

export default App;
