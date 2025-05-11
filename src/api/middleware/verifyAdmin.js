import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

export default async function verifyAdmin(req, res, next) {
	const userId = req.body.userId;
	if (!userId) return res.status(400).json({ message: 'User ID is required' });

	try {
		const userRef = doc(db, 'users', userId);
		const userSnap = await getDoc(userRef);

		if (userSnap.exists() && userSnap.data().isAdmin) {
			next();
		} else {
			res.status(403).json({ message: 'Not authorized' });
		}
	} catch (error) {
		console.error('Error verifying admin:', error);
		res.status(500).json({ message: 'Admin check failed' });
	}
}
