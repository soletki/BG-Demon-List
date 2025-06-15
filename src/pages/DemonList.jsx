import { useEffect, useState } from 'react';
import axios from 'axios';
import './DemonList.css';
import './global.css';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../api/firebase-user';

export default function DemonList() {
	const [levels, setLevels] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const [userToken, setUserToken] = useState('');
	const [showAddModal, setShowAddModal] = useState(false);
	const [showRemoveModal, setShowRemoveModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [addForm, setAddForm] = useState({
		name: '',
		position: '',
		creators: '',
		video: '',
		requirement: '',
	});

	const [selectedLevelToRemove, setSelectedLevelToRemove] = useState('');

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				const uid = user.uid;
				const token = await user.getIdToken();
				setIsAdmin(
					(await axios.get(`/users/${uid}/admin`)).data.isAdmin
				);
				setUserToken(token);
			}
		});
		const fetchLevels = async () => {
			try {
				const response = await axios.get('/levels');
				if (Array.isArray(response.data)) {
					const sorted = response.data.sort(
						(a, b) => a.position - b.position
					);
					setLevels(sorted);
				} else {
					console.error('Expected an array but got:', response.data);
					setError('Invalid data format received');
				}
			} catch (error) {
				console.error('Failed to fetch levels:', error);
				setError('Failed to load levels');
			} finally {
				setLoading(false);
			}
		};
		fetchLevels();
		() => unsubscribe();
	}, []);

	const handleAddLevel = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const creatorsArray = addForm.creators
				.split(',')
				.map((creator) => creator.trim())
				.filter((creator) => creator.length > 0);

			const levelData = {
				name: addForm.name,
				position: parseInt(addForm.position),
				creators: creatorsArray,
				video: addForm.video,
				requirement: parseInt(addForm.requirement),
			};
			console.log(userToken);
			await axios.post('/levels', levelData, {
				headers: { Authorization: `Bearer ${userToken}` },
			});

			setLoading(true);
			const response = await axios.get('/levels');
			const sorted = response.data.sort(
				(a, b) => a.position - b.position
			);
			setLevels(sorted);
			setLoading(false);

			setAddForm({
				name: '',
				position: '',
				creators: '',
				video: '',
				requirement: '',
			});
			setShowAddModal(false);
		} catch (error) {
			console.error('Failed to add level:', error);
			alert('Failed to add level. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleRemoveLevel = async (e) => {
		e.preventDefault();
		if (!selectedLevelToRemove) return;

		setIsSubmitting(true);

		try {
			console.log(userToken);
			await axios.delete(
				`/levels/${encodeURIComponent(selectedLevelToRemove)}`,
				{
					headers: { Authorization: `Bearer ${userToken}` },
				}
			);

			setLoading(true);
			const response = await axios.get('/levels');
			const sorted = response.data.sort(
				(a, b) => a.position - b.position
			);
			setLevels(sorted);
			setLoading(false);

			setSelectedLevelToRemove('');
			setShowRemoveModal(false);
		} catch (error) {
			console.error('Failed to remove level:', error);
			alert('Failed to remove level. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const filteredLevels = levels
		.filter((level) =>
			level.name.toLowerCase().includes(searchTerm.toLowerCase())
		)
		.sort((a, b) => a.position - b.position);

	if (loading)
		return (
			<div>
				<Navbar />
				<div className="loading">Loading demon list...</div>
			</div>
		);

	if (error)
		return (
			<div>
				<Navbar />
				<div className="loading" style={{ color: '#ff6b6b' }}>
					Error: {error}
				</div>
			</div>
		);

	return (
		<div>
			<Navbar />
			<div id="levels-container">
				<div id="search-bar">
					<input
						type="text"
						placeholder="Search..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					{isAdmin && (
						<div className="admin-controls">
							<button
								className="admin-btn add-btn"
								onClick={() => setShowAddModal(true)}
								title="Add Level"
							>
								+
							</button>
							<button
								className="admin-btn remove-btn"
								onClick={() => setShowRemoveModal(true)}
								title="Remove Level"
							>
								−
							</button>
						</div>
					)}
				</div>
				{filteredLevels.length === 0 && searchTerm && (
					<div className="loading">
						No demons found matching "{searchTerm}"
					</div>
				)}
				{filteredLevels.map((level) => {
					const videoId = extractYouTubeId(level.video);
					return (
						<div className="level-container" key={level.position}>
							<a
								href={level.video}
								target="_blank"
								rel="noopener noreferrer"
							>
								<img
									className="level-img"
									src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
									alt={`${level.name} by ${level.creators[0]}`}
									loading="lazy"
								/>
							</a>
							<div className="level-text-container">
								<a href={`/level/${level.position}`}>
									<h4 className="level-name">
										#{level.position} - {level.name}
									</h4>
								</a>
								<p className="level-creator">
									{level.creators[0]}
								</p>
							</div>
						</div>
					);
				})}
			</div>

			{/* Add Level Modal */}
			{showAddModal && (
				<div
					className="modal-overlay"
					onClick={() => setShowAddModal(false)}
				>
					<div
						className="modal-content"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="modal-header">
							<h3>Add New Level</h3>
							<button
								className="modal-close"
								onClick={() => setShowAddModal(false)}
							>
								×
							</button>
						</div>
						<form onSubmit={handleAddLevel} className="modal-form">
							<div className="form-group">
								<label htmlFor="name">Level Name</label>
								<input
									type="text"
									id="name"
									value={addForm.name}
									onChange={(e) =>
										setAddForm({
											...addForm,
											name: e.target.value,
										})
									}
									required
								/>
							</div>
							<div className="form-group">
								<label htmlFor="position">Position</label>
								<input
									type="number"
									id="position"
									value={addForm.position}
									onChange={(e) =>
										setAddForm({
											...addForm,
											position: e.target.value,
										})
									}
									min="1"
									required
								/>
							</div>
							<div className="form-group">
								<label htmlFor="creators">
									Creators (comma-separated)
								</label>
								<input
									type="text"
									id="creators"
									value={addForm.creators}
									onChange={(e) =>
										setAddForm({
											...addForm,
											creators: e.target.value,
										})
									}
									placeholder="Creator1, Creator2, Creator3"
									required
								/>
							</div>
							<div className="form-group">
								<label htmlFor="video">YouTube Video URL</label>
								<input
									type="url"
									id="video"
									value={addForm.video}
									onChange={(e) =>
										setAddForm({
											...addForm,
											video: e.target.value,
										})
									}
									required
								/>
							</div>
							<div className="form-group">
								<label htmlFor="requirement">
									Requirement Percentage
								</label>
								<input
									type="number"
									id="requirement"
									value={addForm.requirement}
									onChange={(e) =>
										setAddForm({
											...addForm,
											requirement: e.target.value,
										})
									}
									min="1"
									max="100"
									required
								/>
							</div>
							<div className="modal-actions">
								<button
									type="button"
									className="btn-secondary"
									onClick={() => setShowAddModal(false)}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="btn-primary"
									disabled={isSubmitting}
								>
									{isSubmitting ? 'Adding...' : 'Add Level'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
			{/* Remove Level Modal */}
			{showRemoveModal && (
				<div
					className="modal-overlay"
					onClick={() => setShowRemoveModal(false)}
				>
					<div
						className="modal-content"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="modal-header">
							<h3>Remove Level</h3>
							<button
								className="modal-close"
								onClick={() => setShowRemoveModal(false)}
							>
								×
							</button>
						</div>
						<form
							onSubmit={handleRemoveLevel}
							className="modal-form"
						>
							<div className="form-group">
								<label htmlFor="levelSelect">
									Select Level to Remove
								</label>
								<select
									id="levelSelect"
									value={selectedLevelToRemove}
									onChange={(e) =>
										setSelectedLevelToRemove(e.target.value)
									}
									required
								>
									<option value="">Choose a level...</option>
									{levels.map((level) => (
										<option
											key={level.position}
											value={level.name}
										>
											#{level.position} - {level.name}
										</option>
									))}
								</select>
							</div>
							<div className="modal-actions">
								<button
									type="button"
									className="btn-secondary"
									onClick={() => setShowRemoveModal(false)}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="btn-danger"
									disabled={
										isSubmitting || !selectedLevelToRemove
									}
								>
									{isSubmitting
										? 'Removing...'
										: 'Remove Level'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

function extractYouTubeId(url) {
	const regex =
		/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/;
	const match = url.match(regex);
	return match ? match[1] : '';
}
