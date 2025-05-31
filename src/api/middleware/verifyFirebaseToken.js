import { admin } from '../firebase.js';

export async function verifyFirebaseToken(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ message: 'Unauthorized: Missing token' });
	}

	const token = authHeader.split(' ')[1];

	try {
		const decoded = await admin.auth().verifyIdToken(token);
		req.user = decoded;
		next();
	} catch (error) {
		console.error('Token verification failed:', error);
		res.status(401).json({ message: 'Unauthorized: Invalid token' });
	}
}
