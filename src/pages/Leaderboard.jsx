import { useEffect, useState } from 'react';
import axios from 'axios';
import './Leaderboard.css';

export default function Leaderboard() {
	const [players, setPlayers] = useState([]);
	const [selectedPlayer, setSelectedPlayer] = useState(null);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		document.title = "Leaderboard"
		const fetchPlayers = async () => {
			try {
				setLoading(true);
				const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/players`);
				const data = await response.data;
				setPlayers(data);
				if (data.length > 0) {
					setSelectedPlayer(data[0]);
				}
			} catch (err) {
				setError('Failed to load leaderboard data.');
				console.error(err.message);
			} finally {
				setLoading(false);
			}
		};
		fetchPlayers();
	}, []);

	const getHardestLevel = (records) => {
		const completedRecords = records.filter(record => record.progress === 100);
		if (completedRecords.length === 0) return 'unknown';
		const hardest = completedRecords.reduce((prev, current) =>
			prev.position < current.position ? prev : current
		);
		return hardest.level;
	};

	const getDemonStats = (records) => {
		const completed = records.filter(r => r.progress === 100);
		const mainList = completed.filter(r => r.position <= 75);
		const extended = completed.filter(r => r.position > 75);
		return { main: mainList.length, extended: extended.length };
	};

	if (loading) return <div className="mainDiv"><div className="loading">Loading leaderboard...</div></div>;
	if (error) return <div className="mainDiv"><div className="error">{error}</div></div>;

	return (
		<div className="mainDiv">
			<div className="container">
				<div className="leaderboardSection">
					<h2 className="sectionTitle">Leaderboard</h2>
					<div className="leaderboardList">
						{players.map((player) => (
							<div
								key={player.id}
								className={`playerRow ${selectedPlayer?.id === player.id ? 'selectedRow' : ''}`}
								onClick={() => setSelectedPlayer(player)}
							>
								<div className="rankBadge">#{player.rank}</div>
								<div className="playerInfo">
									<div className="playerName">{player.name}</div>
									<div className="playerPoints">{player.points.toFixed(2)} pts</div>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="statsSection">
					{selectedPlayer ? (
						<div className="playerCard">
							<div className="playerHeader">
								<span className="playerCardName">{selectedPlayer.name}</span>
							</div>

							<div className="statsGrid">
								<div className="statItem">
									<div className="statLabel">Demonlist rank</div>
									<div className="statValue">{selectedPlayer.rank}</div>
								</div>
								<div className="statItem">
									<div className="statLabel">Demonlist score</div>
									<div className="statValue">{selectedPlayer.points.toFixed(2)}</div>
								</div>
							</div>

							<div className="statsGrid">
								<div className="statItem">
									<div className="statLabel">Demonlist stats</div>
									<div className="statValueGray">
										{(() => {
											const stats = getDemonStats(selectedPlayer.records);
											const parts = [];
											if (stats.main > 0) parts.push(`${stats.main} Main`);
											if (stats.extended > 0) parts.push(`${stats.extended} Extended`);
											return parts.join(', ') || '0 Main, 0 Extended';
										})()}
									</div>
								</div>
								<div className="statItem">
									<div className="statLabel">Hardest demon</div>
									<div className="statValue">{getHardestLevel(selectedPlayer.records)}</div>
								</div>
							</div>

							<div className="demonsSection">
								<div className="statLabel">Demons completed</div>
								<div className="demonsList">
									{selectedPlayer.records.map((record, index) => (
										<span key={index}>
											<a
												href={record.video}
												target="_blank"
												rel="noopener noreferrer"
												className={`demonLink ${record.progress === 100 ? 'completedDemon' : 'incompleteDemon'}`}
											>
												{record.level}
												{record.progress !== 100 && ` (${record.progress}%)`}
											</a>
											{index < selectedPlayer.records.length - 1 && <span className="separator"> - </span>}
										</span>
									))}
								</div>
							</div>
						</div>
					) : (
						<div className="noSelection">
							<h3>Select a player to view their stats</h3>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
