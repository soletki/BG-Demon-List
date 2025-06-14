import { useEffect, useState } from 'react';
import axios from 'axios';
import './Account.css';
import './global.css';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../api/firebase-user';

export default function Account() {
	const [user, setUser] = useState(null);
	const [records, setRecords] = useState([]);
	const [claimlessPlayers, setClaimlessPlayers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedPlayer, setSelectedPlayer] = useState('');
	const [isAdmin, setIsAdmin] = useState(false);
	const [UserId, setUserId] = useState('vkDyoIcBdcQi5D8I2kcVV8KXRLh2');

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				const uid = await user.uid;
				setUserId(uid)
				setIsAdmin(
					(await axios.get(`/users/${uid}/admin`)).data.isAdmin
				);
			} else {
				console.log('No user is logged in');
			}
		});

		return () => unsubscribe();
	}, []);

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const userResponse = await axios.get(`/users/${UserId}`);
				setUser(userResponse.data);

				if (userResponse.data.playerId) {
					const recordsResponse = await axios.get(
						`/records/${userResponse.data.playerId}`
					);
					setRecords(recordsResponse.data);
				}

				if (!userResponse.data.playerId) {
					setClaimlessPlayers(
						(await axios.get('/players/claimless')).data
					);
				}
			} catch (error) {
				console.error('Failed to fetch user data:', error);
				setError('Failed to load account data');
			} finally {
				setLoading(false);
			}
		};
		fetchUserData();
	}, [UserId]);

	const handleCreatePlayer = () => {
		axios.post('/players', {
			username: user.username,
		});
		window.location.reload();
	};

	const handleClaim = async () => {
		if (!selectedPlayer) return;
		console.log(selectedPlayer);
		console.log(UserId);
		try {
			await axios.post('/claims', {
				userId: UserId,
				playerId: selectedPlayer,
			});
			window.location.reload();
		} catch (error) {
			console.error('Failed to create claim:', error);
			alert('Failed to create claim');
		}
	};

	const formatDate = (timestamp) => {
		if (timestamp && timestamp._seconds) {
			return new Date(timestamp._seconds * 1000).toLocaleDateString();
		}
		return 'Unknown date';
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'accepted':
				return '#4CAF50';
			case 'pending':
				return '#FFC107';
			case 'rejected':
				return '#F44336';
			default:
				return '#757575';
		}
	};

	if (loading) {
		return (
			<div>
				<div className="account-loading">Loading account...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div>
				<div className="account-loading" style={{ color: '#ff6b6b' }}>
					Error: {error}
				</div>
			</div>
		);
	}

	return (
		<div>
			<div id="account-container">
				{/* Username Section */}
				<div className="account-section">
					<div className="account-section-header">
						<h2>Account Information</h2>
					</div>
					<div className="account-info-card">
						<div className="account-info-item">
							<span className="account-info-label">
								Username:
							</span>
							<span className="account-info-value">
								{user?.username}
							</span>
						</div>
						{isAdmin && (
							<div className="account-info-item">
								<span className="account-info-label">
									Permissions:
								</span>
								<span className="account-info-value account-admin-badge">
									Admin
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Player Section */}
				<div className="account-section">
					<div className="account-section-header">
						<h2>Player Information</h2>
					</div>
					<div className="account-info-card">
						{user?.playerId ? (
							<div className="account-info-item">
								<span className="account-info-label">
									Player Name:
								</span>
								<span className="account-info-value">
									{user.playerName}
								</span>
								<button className="account-edit-btn">
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
									>
										<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
										<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
									</svg>
								</button>
							</div>
						) : (
							<div className="account-no-claim-section">
								<p className="account-no-claim-text">
									Create new player or claim an existing one
								</p>
								<div className="account-claim-actions">
									<button
										className="account-create-player-btn"
										onClick={handleCreatePlayer}
									>
										Create Player
									</button>
									<div className="account-claim-dropdown">
										<select
											value={selectedPlayer}
											onChange={(e) =>
												setSelectedPlayer(
													e.target.value
												)
											}
											className="account-player-select"
										>
											<option value="">
												Select a player to claim
											</option>
											{claimlessPlayers.map((player) => (
												<option
													key={player.id}
													value={player.id}
												>
													{player.name}
												</option>
											))}
										</select>
										<button
											className="account-claim-btn"
											onClick={handleClaim}
											disabled={!selectedPlayer}
										>
											Send Claim
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Records Section */}
				{user?.playerId && (
					<div className="account-section">
						<div className="account-section-header">
							<h2>Your Records</h2>
						</div>
						{records.length === 0 ? (
							<div className="account-no-records">
								<p>No records found</p>
							</div>
						) : (
							<div className="account-records-list">
								{records.map((record) => (
									<div
										key={record.id}
										className="account-record-item"
										style={{
											borderLeft: `4px solid ${getStatusColor(
												record.status
											)}`,
										}}
									>
										<div className="account-record-header">
											<h3 className="account-record-level">
												{record.levelName}
											</h3>
											<span
												className={`account-record-status ${record.status}`}
											>
												{record.status
													.charAt(0)
													.toUpperCase() +
													record.status.slice(1)}
											</span>
										</div>
										<div className="account-record-details">
											<div className="account-record-progress">
												<span className="account-progress-label">
													Progress:
												</span>
												<span className="account-progress-value">
													{record.progress}%
												</span>
											</div>
											<div className="account-record-date">
												<span className="account-date-label">
													Date:
												</span>
												<span className="account-date-value">
													{formatDate(record.date)}
												</span>
											</div>
											{record.video && (
												<div className="account-record-video">
													<a
														href={record.video}
														target="_blank"
														rel="noopener noreferrer"
													>
														View Video
													</a>
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
