import express from 'express';
import { db } from '../firebase.js';
import verifyAdmin from '../middleware/verifyAdmin.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User registration, admin status, and player claiming
 */
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, uid]
 *             properties:
 *               username:
 *                 type: string
 *               uid:
 *                 type: string
 *     responses:
 *       201:
 *         description: User added successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /users/{uid}/claim:
 *   patch:
 *     summary: Link a user to a player profile (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: UID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [playerId]
 *             properties:
 *               playerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Player claimed successfully
 *       500:
 *         description: Server error
 */
router.patch('/:uid/claim', verifyAdmin, async (req, res) => {
	const uid = req.params.uid;
	const { playerId } = req.body;

	try {
		await db.collection('users').doc(uid).update({
			playerId: playerId,
		});
		await db.collection('players').doc(playerId).update({
			claimed: true,
		});
		res.status(200).json({
			message: 'Claimed player updated successfully',
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

/**
 * @swagger
 * /users/{uid}/claim:
 *   get:
 *     summary: Get player's ID associated with user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: UID of the user
 *     responses:
 *       200:
 *         description: Player ID found
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /users/{uid}/admin:
 *   get:
 *     summary: Check if a user is an admin
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: UID of the user
 *     responses:
 *       200:
 *         description: Returns isAdmin status
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
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
/**
 * @swagger
 * /users/{uid}:
 *   get:
 *     summary: Get user details (including player name if claimed)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: UID of the user
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User or player not found
 *       500:
 *         description: Internal server error
 */
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
