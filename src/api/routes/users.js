import express from 'express';
import { db } from '../firebase.js';
import verifyAdmin from '../middleware/verifyAdmin.js';
const router = express.Router();

router.post('/', async (req, res) => {
	const { username, uid } = req.body;

	if (!username || !uid)
		return res.status(400).json({ message: 'Missing required fields' });

	try {
		await db.collection('users').doc(uid).set({
			name: username,
			playerId: null,
			isAdmin: false,
		});
		res.status(201).json({ message: 'User added successfully!' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: error.message });
	}
});

router.patch('/:uid/claim', verifyAdmin, async (req, res) => {
	const uid = req.params.uid;
	const { playerId } = req.body;

	try {
		await db.collection('users').doc(uid).update({
			playerId: playerId,
		});
		res.status(200).json({
			message: 'Claimed player updated successfully',
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

router.get('/:uid/claim', async (req, res) => {
	const { uid } = req.params;

	try {
		const userDoc = await db.collection('users').doc(uid).get();

		if (!userDoc.exists) {
			return res.status(404).json({ error: 'User not found' });
		}

		const data = userDoc.data();
		const playerId = data.playerId || null;

		res.status(200).json({ playerId });
	} catch (err) {
		console.error('Error fetching playerId:', err);
		res.status(500).json({ error: err.message });
	}
});

router.get('/:uid/admin', async (req, res) => {
	const { uid } = req.params;

	try {
		const userDoc = await db.collection('users').doc(uid).get();

		if (!userDoc.exists) {
			return res.status(404).json({ error: 'User not found' });
		}

		const data = userDoc.data();
		const isAdmin = data.isAdmin || false;

		res.status(200).json({ isAdmin });
	} catch (err) {
		console.error('Error fetching admin status:', err);
		res.status(500).json({ error: err.message });
	}
});

router.get('/:uid', async (req, res) => {
	const { uid } = req.params;

	try {
		const userDoc = await db.collection('users').doc(uid).get();

		if (!userDoc.exists) {
			return res.status(404).json({ error: 'User not found' });
		}

		const userData = userDoc.data();
		const playerId = userData.playerId;

		if (playerId != null) {
			const playerDoc = await db
				.collection('players')
				.doc(playerId)
				.get();

			if (!playerDoc.exists) {
				return res.status(404).json({ error: 'Player not found' });
			}

			const playerData = playerDoc.data();

			return res.json({
				userId: uid,
				playerId: playerId,
				username: userData.name,
				playerName: playerData.name,
			});
		}

		return res.json({
			userId: uid,
			playerId: null,
			username: userData.name,
			playerName: null,
		});
	} catch (err) {
		console.error('Error fetching user or player:', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

export default router;
