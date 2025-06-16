import express from 'express';
import { db } from '../firebase.js';
import verifyAdmin from '../middleware/verifyAdmin.js';
const router = express.Router();

function calculatePoints(pos, n, l, p) {
	if (p < l) {
		return 0;
	}

	const basePoints =
		1 + 322 * Math.exp(-((Math.log(322) / (n - 1)) * (pos - 1)));

	let scale;
	if (p < l) {
		scale = 0;
	} else if (p === l && l != 100) {
		scale = 0.1;
	} else if (p >= 99 && p < 100) {
		scale = 0.5;
	} else if (p === 100) {
		scale = 1;
	} else {
		scale = 0.1 + ((p - l) / (99 - l)) * (0.5 - 0.1);
	}

	return basePoints * scale;
}


/**
 * @swagger
 * tags:
 *   name: Players
 *   description: Player management and leaderboard
 */

/**
 * @swagger
 * /players:
 *   get:
 *     summary: Get all players with their total points and rank
 *     tags: [Players]
 *     responses:
 *       200:
 *         description: A list of players with computed points and rank
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   points:
 *                     type: number
 *                   records:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         level:
 *                           type: string
 *                         position:
 *                           type: integer
 *                         progress:
 *                           type: number
 *                         video:
 *                           type: string
 *                   rank:
 *                     type: integer
 */

router.get('/', async (req, res) => {
	try {
		const playersSnap = await db.collection('players').get();
		const recordsSnap = await db
			.collection('records')
			.where('status', '==', 'accepted')
			.get();
		const levelsSnap = await db.collection('levels').get();

		const players = {};
		const levels = {};

		levelsSnap.forEach((doc) => {
			levels[doc.id] = doc.data();
		});

		playersSnap.forEach((doc) => {
			players[doc.id] = {
				id: doc.id,
				name: doc.data().name,
				points: 0,
				records: [],
			};
		});

		recordsSnap.forEach((doc) => {
			const record = doc.data();
			const player = players[record.playerId];
			const level = levels[record.levelId];

			if (player && level) {
				player.records.push({
					level: level.name,
					position: level.position,
					progress: record.progress,
					video: record.video,
				});
				player.points += calculatePoints(
					level.position,
					150,
					level.requirement,
					record.progress
				);
			}
		});

		const result = Object.values(players)
			.sort((a, b) => b.points - a.points)
			.map((player, index) => ({
				...player,
				rank: index + 1,
			}));

		res.json(result);
	} catch (error) {
		console.error('Error fetching players:', error);
		res.status(500).json({ error: 'Failed to fetch players' });
	}
});

/**
 * @swagger
 * /players:
 *   post:
 *     summary: Create a new player
 *     tags: [Players]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 example: "Toni"
 *     responses:
 *       201:
 *         description: Player created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 claimed:
 *                   type: boolean
 *       400:
 *         description: Invalid username
 *       409:
 *         description: Username already taken
 *       500:
 *         description: Failed to create player
 */

router.post('/', async (req, res) => {
	const { username } = req.body;

	if (
		!username ||
		typeof username !== 'string' ||
		username.trim().length < 3
	) {
		return res.status(400).json({ error: 'Invalid username' });
	}

	try {
		const existing = await db
			.collection('players')
			.where('name', '==', username.trim())
			.limit(1)
			.get();

		if (!existing.empty) {
			return res.status(409).json({ error: 'Username already taken' });
		}

		const newPlayerRef = db.collection('players').doc();

		const playerData = {
			name: username.trim(),
			claimed: false,
		};

		await newPlayerRef.set(playerData);

		res.status(201).json({
			id: newPlayerRef.id,
			...playerData,
		});
	} catch (err) {
		console.error('Error creating player:', err);
		res.status(500).json({ error: 'Failed to create player' });
	}
});

/**
 * @swagger
 * /players/claimless:
 *   get:
 *     summary: Get all players that are not claimed
 *     tags: [Players]
 *     responses:
 *       200:
 *         description: A list of unclaimed players
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   claimed:
 *                     type: boolean
 *       500:
 *         description: Internal server error
 */

router.get('/claimless', async (req, res) => {
	try {
		const snapshot = await db
			.collection('players')
			.where('claimed', '==', false)
			.get();

		if (snapshot.empty) {
			return res.status(200).json([]);
		}

		const claimlessPlayers = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

		return res.json(claimlessPlayers);
	} catch (err) {
		console.error('Error fetching claimless players:', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

export default router;
