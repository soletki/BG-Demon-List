import { Routes, Route } from 'react-router-dom';

import DemonList from './pages/DemonList';
import RecordSubmission from './pages/RecordSubmission';
import Auth from './pages/Auth';
import Level from './pages/Level';
import Leaderboard from './pages/Leaderboard';
import Navbar from './components/Navbar';
import Admin from './pages/Admin';

function App() {
	return (
		<div>
      <Navbar/>
			<Routes>
				<Route path="/" element={<DemonList />} />
				<Route path="/admin" element={<Admin />} />
				<Route path="/list" element={<DemonList />} />
				<Route path="/auth" element={<Auth />} />
				<Route path="/leaderboard" element={<Leaderboard />} />
				<Route path="/submit" element={<RecordSubmission />} />
				<Route path="/level/:position" element={<Level />} />
			</Routes>
		</div>
	);
}

export default App;
