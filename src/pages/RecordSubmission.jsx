import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase-user';
import './RecordSubmission.css';
import axios from 'axios';

export default function RecordSubmission() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [playerId, setPlayerId] = useState('');
	const [levels, setLevels] = useState([]);
	const [formData, setFormData] = useState({
		levelId: '',
		progress: '',
		videoLink: '',
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [selectedLevel, setSelectedLevel] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				const uid = await user.uid;
				setIsLoggedIn(true);

				await setPlayerId((await axios.get(`/users/${uid}/claim`)).data.playerId)
				await fetchLevels();
			}
		});

		return () => unsubscribe();
	}, []);

	const fetchLevels = async () => {
		try {
			const response = await axios.get('/levels');
			setLevels(response.data);
			console.log(levels)
		} catch (err) {
			console.error('Failed to fetch levels:', err);
			setError('Failed to load levels');
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData({
			...formData,
			[name]: value,
		});
		setError('');
		setSuccess('');

		// Update selected level when level dropdown changes
		if (name === 'levelId') {
			const level = levels.find((l) => l.position.toString() === value);
			console.log(level)
			setSelectedLevel(level);
		}
	};

	const validateForm = () => {
		if (!formData.levelId) {
			setError('Please select a level');
			return false;
		}

		if (!formData.progress) {
			setError('Please enter your progress percentage');
			return false;
		}

		const progress = parseInt(formData.progress);
		if (isNaN(progress) || progress < 0 || progress > 100) {
			setError('Progress must be a number between 0 and 100');
			return false;
		}

		if (selectedLevel && progress < selectedLevel.requirement) {
			setError(
				`Progress must be at least ${selectedLevel.requirement}% for ${selectedLevel.name}`
			);
			return false;
		}

		if (!formData.videoLink) {
			setError('Please provide a video link');
			return false;
		}

		// Basic YouTube URL validation
		const youtubeRegex =
			/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
		if (!youtubeRegex.test(formData.videoLink)) {
			setError('Please enter a valid YouTube URL');
			return false;
		}

		return true;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setLoading(true);
		setError('');
		setSuccess('');

		try {
			await axios.post('/records', {
				playerId: playerId,
				levelId: selectedLevel.levelId,
				progress: parseInt(formData.progress),
				video: formData.videoLink,
			});

			setSuccess('Record submitted successfully!');
			setFormData({
				levelId: '',
				progress: '',
				videoLink: '',
			});
			setSelectedLevel(null);
		} catch (err) {
			console.error('Failed to submit record:', err);
			setError('Failed to submit record. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	if (!isLoggedIn) {
		return (
			<div className="record-main-div">
				<div className="record-container">
					<h1 className="title">Authentication Required</h1>
					<p className="record-subtitle">
						Please log in to submit a record
					</p>
					<div className="login-prompt">
						<p className="login-text">
							You need to be logged in to submit records to the
							demonlist.
						</p>
						<button
							className="login-button"
							onClick={() => navigate('/auth')}
						>
							Go to Login
						</button>
					</div>
				</div>
			</div>
		);
	}else if(playerId==null){
		return (
			<div className="record-main-div">
				<div className="record-container">
					<h1 className="title">No Player Claim</h1>
					<p className="record-subtitle">
						Please claim or create a player to submit a record
					</p>
					<div className="login-prompt">
						<button
							className="login-button"
							onClick={() => navigate('/account')}
						>
							Go to Account
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="record-main-div">
			<div className="record-container">
				{loading && (
					<div className="loading-overlay">
						<div className="loading-spinner"></div>
					</div>
				)}

				<h1 className="title">Submit a Record</h1>
				<p className="record-subtitle">
					Share your progress on the demonlist
				</p>

				<form onSubmit={handleSubmit} className="record-form">
					<div className="input-group">
						<label className="input-label">Level</label>
						<select
							name="levelId"
							value={formData.levelId}
							onChange={handleInputChange}
							className="record-select"
							required
						>
							<option value="">Select a level</option>
							{levels.map((level) => (
								<option
									key={level.position}
									value={level.position}
								>
									#{level.position} - {level.name}
								</option>
							))}
						</select>
						{selectedLevel && (
							<div className="level-info">
								Minimum progress required:{' '}
								{selectedLevel.requirement}%
							</div>
						)}
					</div>

					<div className="input-group">
						<label className="input-label">Progress (%)</label>
						<input
							type="number"
							name="progress"
							value={formData.progress}
							onChange={handleInputChange}
							className="record-input"
							placeholder="Enter your progress percentage"
							min="0"
							max="100"
							required
						/>
					</div>

					<div className="input-group">
						<label className="input-label">Video Link</label>
						<input
							type="url"
							name="videoLink"
							value={formData.videoLink}
							onChange={handleInputChange}
							className="record-input"
							placeholder="https://www.youtube.com/watch?v=..."
							required
						/>
					</div>

					{error && <div className="error-message">{error}</div>}
					{success && (
						<div className="success-message">{success}</div>
					)}

					<button
						type="submit"
						disabled={loading}
						className="submit-button"
					>
						{loading ? 'Submitting...' : 'Submit Record'}
					</button>
				</form>
			</div>
		</div>
	);
}
