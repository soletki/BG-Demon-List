import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Leaderboard() {
	const [players, setPlayers] = useState([]);
	const [selectedPlayer, setSelectedPlayer] = useState(null);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchPlayers = async () => {
			try {
				setLoading(true);
				const response = await axios.get('/players');
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
		
		return { main: mainList.length, extended: extended.length};
	};

	if (loading) return (
		<div style={styles.mainDiv}>
			<div style={styles.loading}>Loading leaderboard...</div>
		</div>
	);

	if (error) return (
		<div style={styles.mainDiv}>
			<div style={styles.error}>{error}</div>
		</div>
	);

	return (
		<div style={styles.mainDiv}>
			<div style={styles.container}>
				{/* Leaderboard Section */}
				<div style={styles.leaderboardSection}>
					<h2 style={styles.sectionTitle}>Leaderboard</h2>
					<div style={styles.leaderboardList}>
						{players.map((player) => (
							<div
								key={player.id}
								style={{
									...styles.playerRow,
									...(selectedPlayer?.id === player.id ? styles.selectedRow : {})
								}}
								onClick={() => setSelectedPlayer(player)}
							>
								<div style={styles.rankBadge}>#{player.rank}</div>
								<div style={styles.playerInfo}>
									<div style={styles.playerName}>{player.name}</div>
									<div style={styles.playerPoints}>{player.points.toFixed(2)} pts</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Stats Viewer Section */}
				<div style={styles.statsSection}>
					{selectedPlayer ? (
						<>
							<div style={styles.playerCard}>
								<div style={styles.playerHeader}>
									<span style={styles.playerCardName}>{selectedPlayer.name}</span>
								</div>
								
								<div style={styles.statsGrid}>
									<div style={styles.statItem}>
										<div style={styles.statLabel}>Demonlist rank</div>
										<div style={styles.statValue}>{selectedPlayer.rank}</div>
									</div>
									<div style={styles.statItem}>
										<div style={styles.statLabel}>Demonlist score</div>
										<div style={styles.statValue}>{selectedPlayer.points.toFixed(2)}</div>
									</div>
								</div>

								<div style={styles.statsGrid}>
									<div style={styles.statItem}>
										<div style={styles.statLabel}>Demonlist stats</div>
										<div style={styles.statValueGray}>
											{(() => {
												const stats = getDemonStats(selectedPlayer.records);
												const parts = [];
												if (stats.main > 0) parts.push(`${stats.main} Main`);
												if (stats.extended > 0) parts.push(`${stats.extended} Extended`);
												return parts.join(', ') || '0 Main, 0 Extended';
											})()}
										</div>
									</div>
									<div style={styles.statItem}>
										<div style={styles.statLabel}>Hardest demon</div>
										<div style={styles.statValue}>{getHardestLevel(selectedPlayer.records)}</div>
									</div>
								</div>

								<div style={styles.demonsSection}>
									<div style={styles.statLabel}>Demons completed</div>
									<div style={styles.demonsList}>
										{selectedPlayer.records.map((record, index) => (
											<span key={index}>
												<a
													href={record.video}
													target="_blank"
													rel="noopener noreferrer"
													style={{
														...styles.demonLink,
														...(record.progress === 100 ? styles.completedDemon : styles.incompleteDemon)
													}}
												>
													{record.level}
													{record.progress !== 100 && ` (${record.progress}%)`}
												</a>
												{index < selectedPlayer.records.length - 1 && (
													<span style={styles.separator}> - </span>
												)}
											</span>
										))}
									</div>
								</div>
							</div>
						</>
					) : (
						<div style={styles.noSelection}>
							<h3>Select a player to view their stats</h3>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

const styles = {
	mainDiv: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		padding: '40px 20px',
		background: 'linear-gradient(135deg, #1a1c23 0%, #2d3039 100%)',
		minHeight: '100vh',
		fontFamily: "'Montserrat', sans-serif",
	},
	container: {
		display: 'flex',
		gap: '30px',
		maxWidth: '1400px',
		width: '100%',
		minHeight: 'calc(100vh - 120px)',
		flexWrap: 'wrap',
	},
	leaderboardSection: {
		flex: '1',
		minWidth: '350px',
		background: 'linear-gradient(135deg, #21232b 0%, #2a2d36 100%)',
		borderRadius: '25px',
		border: '1px solid rgba(255, 255, 255, 0.1)',
		boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 255, 255, 0.1) inset',
		backdropFilter: 'blur(10px)',
		overflow: 'hidden',
		display: 'flex',
		flexDirection: 'column',
		maxHeight: '80vh',
	},
	statsSection: {
		flex: '1.5',
		minWidth: '500px',
		display: 'flex',
		flexDirection: 'column',
	},
	sectionTitle: {
		color: '#ffffff',
		fontSize: '1.8em',
		fontWeight: '600',
		textAlign: 'center',
		margin: '0',
		padding: '25px',
		background: 'rgba(255, 255, 255, 0.03)',
		borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
		background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
		WebkitBackgroundClip: 'text',
		WebkitTextFillColor: 'transparent',
		backgroundClip: 'text',
		textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
	},
	leaderboardList: {
		flex: '1',
		overflowY: 'auto',
		padding: '10px',
	},
	playerRow: {
		display: 'flex',
		alignItems: 'center',
		padding: '15px 20px',
		margin: '5px 0',
		borderRadius: '15px',
		cursor: 'pointer',
		transition: 'all 0.3s ease',
		border: '1px solid transparent',
		background: 'rgba(255, 255, 255, 0.02)',
	},
	selectedRow: {
		background: 'rgba(255, 107, 107, 0.15)',
		border: '1px solid rgba(255, 107, 107, 0.3)',
		boxShadow: '0 4px 15px rgba(255, 107, 107, 0.1)',
	},
	rankBadge: {
		background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
		color: '#ffffff',
		padding: '8px 12px',
		borderRadius: '10px',
		fontWeight: '700',
		fontSize: '0.9em',
		minWidth: '45px',
		textAlign: 'center',
		marginRight: '15px',
		boxShadow: '0 4px 10px rgba(255, 107, 107, 0.3)',
	},
	playerInfo: {
		flex: '1',
	},
	playerName: {
		color: '#ffffff',
		fontSize: '1.1em',
		fontWeight: '600',
		marginBottom: '4px',
	},
	playerPoints: {
		color: '#b0b0b0',
		fontSize: '0.9em',
		fontWeight: '400',
	},
	playerCard: {
		background: 'linear-gradient(135deg, #21232b 0%, #2a2d36 100%)',
		borderRadius: '25px',
		border: '1px solid rgba(255, 255, 255, 0.1)',
		boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 255, 255, 0.1) inset',
		backdropFilter: 'blur(10px)',
		padding: '30px',
		width: '100%',
	},
	playerHeader: {
		display: 'flex',
		alignItems: 'center',
		marginBottom: '30px',
		paddingBottom: '20px',
		borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
	},
	flagIcon: {
		fontSize: '1.5em',
		marginRight: '12px',
	},
	playerCardName: {
		color: '#ffffff',
		fontSize: '1.8em',
		fontWeight: '700',
		background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
		WebkitBackgroundClip: 'text',
		WebkitTextFillColor: 'transparent',
		backgroundClip: 'text',
	},
	statsGrid: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '30px',
		marginBottom: '30px',
	},
	statItem: {
		display: 'flex',
		flexDirection: 'column',
	},
	statLabel: {
		color: '#888888',
		fontSize: '1em',
		fontWeight: '500',
		marginBottom: '8px',
	},
	statValue: {
		color: '#ffffff',
		fontSize: '1.4em',
		fontWeight: '700',
	},
	statValueGray: {
		color: '#cccccc',
		fontSize: '1.1em',
		fontWeight: '500',
	},
	demonsSection: {
		marginTop: '20px',
		paddingTop: '20px',
		borderTop: '1px solid rgba(255, 255, 255, 0.1)',
	},
	demonsList: {
		marginTop: '12px',
		lineHeight: '1.6',
	},
	demonLink: {
		textDecoration: 'none',
		fontWeight: '500',
		transition: 'all 0.2s ease',
	},
	completedDemon: {
		color: '#ffffff',
	},
	incompleteDemon: {
		color: '#888888',
		fontStyle: 'italic',
	},
	separator: {
		color: '#666666',
	},
	noSelection: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		color: '#b0b0b0',
		fontSize: '1.2em',
		fontStyle: 'italic',
		height: '300px',
	},
	loading: {
		color: '#ffffff',
		fontFamily: "'Montserrat', sans-serif",
		fontSize: '1.2em',
		textAlign: 'center',
		marginTop: '50px',
		padding: '20px',
	},
	error: {
		color: '#ff6b6b',
		background: 'rgba(255, 107, 107, 0.1)',
		border: '1px solid rgba(255, 107, 107, 0.3)',
		borderRadius: '10px',
		maxWidth: '400px',
		margin: '50px auto',
		fontFamily: "'Montserrat', sans-serif",
		fontSize: '1.2em',
		textAlign: 'center',
		padding: '20px',
	},
};