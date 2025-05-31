import { admin } from '../firebase.js';

export default async function verifyAdmin(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ message: 'Missing or invalid Authorization header' });
	}

	const idToken = authHeader.split(' ')[1];

	try {
		const decodedToken = await admin.auth().verifyIdToken(idToken);
		const uid = decodedToken.uid;

		const userDoc = await admin.firestore().doc(`users/${uid}`).get();

		if (!userDoc.exists) {
			return res.status(404).json({ message: 'User document not found' });
		}

		const userData = userDoc.data();

		if (userData.isAdmin === true) {
			req.user = { uid, ...userData };
			next();
		} else {
			return res.status(403).json({ message: 'Not authorized: Admins only' });
		}
	} catch (error) {
		console.error('Admin check failed:', error);
		return res.status(401).json({ message: 'Invalid or expired token' });
	}
}
