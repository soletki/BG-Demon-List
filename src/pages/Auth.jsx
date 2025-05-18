import { useState, useEffect } from 'react';
import { auth, db } from '../api/firebase';
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	onAuthStateChanged,
	signOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Auth() {
	const [email, setEmail] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [isRegistering, setIsRegistering] = useState(false);
	const [error, setError] = useState('');
	const [user, setUser] = useState(null);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
		});
		return () => unsubscribe();
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		try {
			if (isRegistering) {
				if (!username.trim()) {
					setError('Username is required.');
					return;
				}

				const userCred = await createUserWithEmailAndPassword(
					auth,
					email,
					password
				);

				await setDoc(doc(db, 'users', userCred.user.uid), {
					name: username,
					playerId: null,
					isAdmin: false,
				});
			} else {
				await signInWithEmailAndPassword(auth, email, password);
			}
		} catch (err) {
			setError(err.message);
		}
	};

	const handleLogout = async () => {
		await signOut(auth);
	};

	return (
		<div className="max-w-sm mx-auto p-4 mt-10 border rounded-xl shadow-md">
			<h2 className="text-2xl font-bold mb-4 text-center">
				{isRegistering ? 'Register' : 'Login'}
			</h2>

			{user ? (
				<div className="space-y-4">
					<p className="text-green-600 text-center">
						Logged in as {user.uid}
					</p>
					<button
						onClick={handleLogout}
						className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700"
					>
						Log out
					</button>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="space-y-4">
					{isRegistering && (
						<input
							type="text"
							className="w-full p-2 border rounded"
							placeholder="Username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
						/>
					)}
					<input
						type="email"
						className="w-full p-2 border rounded"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					<input
						type="password"
						className="w-full p-2 border rounded"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
					<button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
						{isRegistering ? 'Register' : 'Login'}
					</button>
				</form>
			)}

			{error && <p className="text-red-500 mt-2 text-sm">{error}</p>}

			{!user && (
				<div className="text-center mt-4">
					<button
						onClick={() => setIsRegistering(!isRegistering)}
						className="text-sm text-blue-600 underline"
					>
						{isRegistering
							? 'Already have an account? Log in'
							: 'No account? Register'}
					</button>
				</div>
			)}
		</div>
	);
}
