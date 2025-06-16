import { useState, useEffect } from 'react';
import './Admin.css';
import axios from 'axios';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase-user';

export default function AdminPage() {
	const [activeTab, setActiveTab] = useState('records');
	const [records, setRecords] = useState([]);
	const [claims, setClaims] = useState([]);
	const [selectedRecord, setSelectedRecord] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [token, setToken] = useState('');

	// Filters for records
	const [playerFilter, setPlayerFilter] = useState('');
	const [levelFilter, setLevelFilter] = useState('');
	const [statusFilters, setStatusFilters] = useState({
		accepted: false,
		pending: true,
		rejected: false,
	});

	useEffect(() => {
		fetchData();
	}, []);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				const token = await user.getIdToken();
				setToken(token);
			} else {
				console.log('No user is logged in');
			}
		});

		return () => unsubscribe();
	}, []);

	async function fetchData() {
		try {
			setLoading(true);
			const recordsData = (await axios.get('/records')).data;
			const claimsData = (await axios.get('/claims')).data;
			setRecords(recordsData);
			setClaims(claimsData);
		} catch (err) {
			setError('Failed to load data');
			console.error(err);
			// Demo data for testing
			setRecords(recordsData);
			setClaims([
				{
					userId: '9DJIDjdks4jdds45djDI',
					playerId: 'soduj98udshjajkdh90',
					userName: 'Pesho',
					playerName: 'PeshoGD',
				},
				{
					userId: 'abc123',
					playerId: 'def456',
					userName: 'John',
					playerName: 'JohnGD',
				},
			]);
		} finally {
			setLoading(false);
		}
	}

	async function updateRecordStatus(recordId, status) {
		try {
			try {
				axios.patch(`/records/${recordId}/${status}`, null, {
					headers: { Authorization: `Bearer ${token}` },
				});
			} catch (err) {
				throw new Error(err.message);
			}

			setRecords(
				records.map((record) =>
					record.id === recordId ? { ...record, status } : record
				)
			);
			if (selectedRecord && selectedRecord.id === recordId) {
				setSelectedRecord({ ...selectedRecord, status });
			}
		} catch (err) {
			console.error('Failed to update record status:', err);
		}
	}

	async function handleClaim(claimId, userId, playerId, approve) {
		try {
			if (approve) {
				await axios.patch(
					`/users/${userId}/claim`,
					{
						playerId: playerId,
					},
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);
			}
			setClaims(claims.filter((claim) => claim.userId !== userId));
			await axios.delete(`/claims/${claimId}`, null, {
				headers: { Authorization: `Bearer ${token}` },
			});
		} catch (err) {
			console.error('Failed to handle claim:', err.message);
		}
	}

	function extractYouTubeId(url) {
		const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
		return match ? match[1] : '';
	}

	function getStatusColor(status) {
		switch (status) {
			case 'accepted':
				return 'status-accepted';
			case 'rejected':
				return 'status-rejected';
			case 'pending':
				return 'status-pending';
			default:
				return 'status-default';
		}
	}

	const filteredRecords = records.filter((record) => {
		const playerMatch = record.playerId
			.toLowerCase()
			.includes(playerFilter.toLowerCase());
		const levelMatch = record.levelId
			.toLowerCase()
			.includes(levelFilter.toLowerCase());
		const statusMatch = statusFilters[record.status];
		return playerMatch && levelMatch && statusMatch;
	});

	if (loading) {
		return (
			<div className="admin-container">
				<div className="loading">Loading admin data...</div>
			</div>
		);
	}

	if (error && records.length === 0) {
		return (
			<div className="admin-container">
				<div className="error">{error}</div>
			</div>
		);
	}

	return (
		<div className="admin-container">
			<div className="admin-main-container">
				<h1 className="admin-title">Admin Panel</h1>

				{/* Tab Navigation */}
				<div className="tab-nav">
					<button
						className={`tab-button ${
							activeTab === 'records' ? 'active-tab' : ''
						}`}
						onClick={() => setActiveTab('records')}
					>
						Records
					</button>
					<button
						className={`tab-button ${
							activeTab === 'claims' ? 'active-tab' : ''
						}`}
						onClick={() => setActiveTab('claims')}
					>
						Claims
					</button>
				</div>

				{/* Records Tab */}
				{activeTab === 'records' && (
					<div className="tab-content">
						<div className="records-layout">
							{/* Left Side - Records List */}
							<div className="records-list">
								<h3 className="section-title">Records</h3>

								{/* Filters */}
								<div className="filters">
									<input
										type="text"
										placeholder="Filter by player name"
										value={playerFilter}
										onChange={(e) =>
											setPlayerFilter(e.target.value)
										}
										className="filter-input"
									/>
									<input
										type="text"
										placeholder="Filter by level name"
										value={levelFilter}
										onChange={(e) =>
											setLevelFilter(e.target.value)
										}
										className="filter-input"
									/>
									<div className="checkbox-group">
										{[
											'accepted',
											'pending',
											'rejected',
										].map((status) => (
											<label
												key={status}
												className="checkbox-label"
											>
												<input
													type="checkbox"
													checked={
														statusFilters[status]
													}
													onChange={(e) =>
														setStatusFilters({
															...statusFilters,
															[status]:
																e.target
																	.checked,
														})
													}
													className="checkbox"
												/>
												{status
													.charAt(0)
													.toUpperCase() +
													status.slice(1)}
											</label>
										))}
									</div>
								</div>

								{/* Records List */}
								<div className="record-items">
									{filteredRecords.map((record) => (
										<div
											key={record.id}
											className={`record-item ${
												selectedRecord?.id === record.id
													? 'selected-record'
													: ''
											}`}
											onClick={() =>
												setSelectedRecord(record)
											}
										>
											<div className="record-info">
												<div className="record-title">
													{record.levelName}
												</div>
												<div className="record-player">
													by {record.playerName}
												</div>
											</div>
											<div
												className={`status-indicator ${getStatusColor(
													record.status
												)}`}
											>
												{record.status}
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Right Side - Record Details */}
							<div className="record-details">
								{selectedRecord ? (
									<div>
										<h3 className="section-title">
											Record Details
										</h3>
										<div className="details-content">
											<div className="detail-item">
												<strong>Level:</strong>{' '}
												{selectedRecord.levelName}
											</div>
											<div className="detail-item">
												<strong>Player:</strong>{' '}
												{selectedRecord.playerName}
											</div>
											<div className="detail-item">
												<strong>Progress:</strong>{' '}
												{selectedRecord.progress}%
											</div>
											<div className="detail-item">
												<strong>Status:</strong>
												<select
													value={
														selectedRecord.status
													}
													onChange={(e) => {
														console.log(
															selectedRecord
														);
														updateRecordStatus(
															selectedRecord.id,
															e.target.value
														);
													}}
													className="status-dropdown"
												>
													<option value="pending">
														Pending
													</option>
													<option value="accepted">
														Accepted
													</option>
													<option value="rejected">
														Rejected
													</option>
												</select>
											</div>
											<div className="video-container">
												<iframe
													src={`https://www.youtube.com/embed/${extractYouTubeId(
														selectedRecord.video
													)}`}
													title="Record video"
													allowFullScreen
													className="video-iframe"
												/>
											</div>
										</div>
									</div>
								) : (
									<div className="no-selection">
										Select a record to view details
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Claims Tab */}
				{activeTab === 'claims' && (
					<div className="tab-content">
						<h3 className="section-title">User Claims</h3>
						<div className="claims-list">
							{claims.map((claim) => (
								<div key={claim.userId} className="claim-item">
									<div className="claim-info">
										<div className="claim-user">
											<strong>User:</strong>{' '}
											{claim.userName}
										</div>
										<div className="claim-player">
											<strong>Claims:</strong>{' '}
											{claim.playerName}
										</div>
									</div>
									<div className="claim-actions">
										<button
											className="action-button approve-button"
											onClick={() =>
												handleClaim(
													claim.claimId,
													claim.userId,
													claim.playerId,
													true
												)
											}
											title="Approve claim"
										>
											✓
										</button>
										<button
											className="action-button reject-button"
											onClick={() =>
												handleClaim(
													claim.claimId,
													claim.userId,
													claim.playerId,
													false
												)
											}
											title="Reject claim"
										>
											✗
										</button>
									</div>
								</div>
							))}
							{claims.length === 0 && (
								<div className="no-claims">
									No pending claims
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
