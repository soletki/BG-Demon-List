import { Routes, Route } from 'react-router-dom';

import DemonList from './pages/DemonList'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DemonList />} />
    </Routes>
  );
}

export default App;
