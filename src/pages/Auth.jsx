import React, { useState, useEffect } from 'react';
import './Auth.css';
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	onAuthStateChanged,
} from 'firebase/auth';
import axios from 'axios';
import { auth } from '../api/firebase-user';
import Navbar from '../components/Navbar';

export default function Auth() {
	const [isLogin, setIsLogin] = useState(true);
	const [formData, setFormData] = useState({
		username: '',
		email: '',
		password: '',
		confirmPassword: '',
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				console.log('Logged in user:', {
					uid: user.uid,
					email: user.email,
				});

				const token = await user.getIdToken();
				console.log('ID Token:', token);
			} else {
				console.log('No user is logged in');
			}
		});

		return () => unsubscribe();
	}, []);

	const handleInputChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
		setError('');
	};

	const validateForm = () => {
		if (!isLogin && formData.password !== formData.confirmPassword) {
			setError('Passwords do not match');
			return false;
		}

		if (formData.password.length < 6) {
			setError('Password must be at least 6 characters');
			return false;
		}

		if (!isLogin && formData.username.length < 3) {
			setError('Username must be at least 3 characters');
			return false;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			setError('Please enter a valid email address');
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

		try {
			let userCredential;
			if (isLogin) {
				userCredential = await signInWithEmailAndPassword(
					auth,
					formData.email,
					formData.password
				);
			} else {
				userCredential = await createUserWithEmailAndPassword(
					auth,
					formData.email,
					formData.password
				);

				axios.post("/users", {
					username: formData.username,
					uid: userCredential.user.uid
				})
			}

			setFormData({
				username: '',
				email: '',
				password: '',
				confirmPassword: '',
			});

			console.log('Login/Register successful');
			window.location.assign('/account')
		} catch (err) {
			console.error(err);
			setError('Authentication failed');
		} finally {
			setLoading(false);
		}
	};

	const handleSocialLogin = (provider) => {
		console.log(`${provider} login clicked`);
	};

	const toggleMode = () => {
		setIsLogin(!isLogin);
		setError('');
		setFormData({
			username: '',
			email: '',
			password: '',
			confirmPassword: '',
		});
	};

	return (
		<div>
			<div className="auth-main-div">
				<div className="auth-container">
					{loading && (
						<div className="loading-overlay">
							<div className="loading-spinner"></div>
						</div>
					)}

					<h1 className="auth-title">
						{isLogin ? 'Welcome Back' : 'Join the Community'}
					</h1>

					<p className="auth-subtitle">
						{isLogin
							? 'Sign in to access your demonlist account'
							: 'Create your demonlist account'}
					</p>

					<form onSubmit={handleSubmit} className="auth-form">
						{!isLogin && (
							<div className="input-group">
								<label className="input-label">Username</label>
								<input
									type="text"
									name="username"
									value={formData.username}
									onChange={handleInputChange}
									className="auth-input"
									placeholder="Choose a username"
									required={!isLogin}
									minLength={3}
									maxLength={20}
								/>
							</div>
						)}

						<div className="input-group">
							<label className="input-label">Email Address</label>
							<input
								type="email"
								name="email"
								value={formData.email}
								onChange={handleInputChange}
								className="auth-input"
								placeholder="Enter your email address"
								required
							/>
						</div>

						<div className="input-group">
							<label className="input-label">Password</label>
							<input
								type="password"
								name="password"
								value={formData.password}
								onChange={handleInputChange}
								className="auth-input"
								placeholder="Enter a secure password"
								required
								minLength={6}
							/>
						</div>

						{!isLogin && (
							<div className="input-group">
								<label className="input-label">
									Confirm Password
								</label>
								<input
									type="password"
									name="confirmPassword"
									value={formData.confirmPassword}
									onChange={handleInputChange}
									className="auth-input"
									placeholder="Confirm your password"
									required={!isLogin}
									minLength={6}
								/>
							</div>
						)}

						{error && <div className="error-message">{error}</div>}

						<button
							type="submit"
							disabled={loading}
							className="submit-button"
						>
							{loading
								? 'Processing...'
								: isLogin
								? 'Sign In'
								: 'Create Account'}
						</button>
					</form>

					<div className="auth-divider">
						<span className="divider-text">or continue with</span>
					</div>

					<div className="social-buttons">
						<button
							className="social-button"
							onClick={() => handleSocialLogin('Google')}
							type="button"
						>
							<span className="social-icon">G</span>
							Continue with Google
						</button>
						<button
							className="social-button"
							onClick={() => handleSocialLogin('Discord')}
							type="button"
						>
							<span className="social-icon">D</span>
							Continue with Discord
						</button>
					</div>

					<div className="toggle-section">
						<p className="toggle-text">
							{isLogin
								? "Don't have an account?"
								: 'Already have an account?'}
							<button
								type="button"
								onClick={toggleMode}
								className="toggle-button"
							>
								{isLogin ? 'Sign Up' : 'Sign In'}
							</button>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
