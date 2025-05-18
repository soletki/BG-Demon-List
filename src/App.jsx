import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import DemonList from './pages/DemonList'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/list" element={<DemonList />} />
    </Routes>
  );
}

export default App;
