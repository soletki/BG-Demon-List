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

router.post('/', verifyAdmin, async (req, res) => {
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

export default router;
