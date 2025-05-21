import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import './global.css';
import './Level.css';
import RecordTable from '../components/RecordTable';

export default function LevelPage() {
	const { position } = useParams();
	const [level, setLevel] = useState(null);
	const [error, setError] = useState('');

	useEffect(() => {
		async function fetchLevel() {
			try {
				const response = await axios.get(`/levels/${position}`);
				setLevel(response.data);
			} catch (err) {
				setError('Level not found or failed to load.');
				console.error(err.message);
			}
		}

		fetchLevel();
	}, [position]);

	if (error) return <div>{error}</div>;
	if (!level) return <div>Loading...</div>;

	return (
		<div>
			<Navbar />
			<div id="main-div">
				<div id="level-container">
					<h1>{level.name}</h1>
					<h2>by {level.creators}</h2>
					<iframe
						id="level-video"
						src={
							`https://www.youtube.com/embed/` +
							extractYouTubeId(level.video)
						}
					></iframe>
					<div id='bottom-subs'>
						<div>
							<h2>{`Demonlist score (100%):`}</h2>
							<h2>
								{calculatePoints(level.position, 150).toFixed(
									2
								)}
							</h2>
						</div>
						{level.position<=75 &&
						<div>
							<h2>{`Demonlist score (${level.requirement}%):`}</h2>
							<h2>
								{(
									calculatePoints(level.position, 150) * 0.1
								).toFixed(2)}
							</h2>
						</div>
						}
					</div>
				</div>
				<RecordTable records={level.records}/>
			</div>
		</div>
	);
}

// Helper function
function extractYouTubeId(url) {
	const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
	return match ? match[1] : '';
}

function calculatePoints(pos, n) {
	return 1 + 322 * Math.exp(-((Math.log(322) / (n - 1)) * (pos - 1)));
}
