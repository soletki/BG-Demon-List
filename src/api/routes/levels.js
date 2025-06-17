import express from 'express';
import { db } from '../firebase.js';
import verifyAdmin from '../middleware/verifyAdmin.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Levels
 *   description: Level management (CRUD)
 */

/**
 * @swagger
 * /levels:
 *   get:
 *     summary: Get all levels with optional pagination
 *     tags: [Levels]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Maximum number of levels to return
 *       - in: query
 *         name: after
 *         schema:
 *           type: integer
 *         description: Start listing after this position value (used for pagination)
 *     responses:
 *       200:
 *         description: List of levels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   levelId:
 *                     type: string
 *                   name:
 *                     type: string
 *                   creators:
 *                     type: array
 *                     items:
 *                       type: string
 *                   video:
 *                     type: string
 *                   requirement:
 *                     type: integer
 *                   position:
 *                     type: integer
 *       400:
 *         description: Invalid parameters or no levels found
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
	try {
		const { limit, after } = req.query;

		let query = db.collection('levels').orderBy('position');

		if (after !== undefined) {
			const afterPosition = parseInt(after, 10);
			if (isNaN(afterPosition)) {
				return res.status(400).json({ message: 'Invalid "after" parameter (must be a number)' });
			}
			query = query.startAfter(afterPosition);
		}

		if (limit !== undefined) {
			const parsedLimit = parseInt(limit, 10);
			if (isNaN(parsedLimit) || parsedLimit <= 0) {
				return res.status(400).json({ message: 'Invalid "limit" parameter' });
			}
			query = query.limit(parsedLimit);
		}

		const snapshot = await query.get();

		if (snapshot.empty) return res.sendStatus(400);

		const levels = snapshot.docs.map((doc) => ({
			levelId: doc.id,
			...doc.data(),
		}));

		res.status(200).json(levels);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

router.get('/explain', async (req, res) => {
	try {
		const query = db.collection('levels').orderBy('position');

		const explain = await query.explain({ analyze: true });

		res.status(200).json(explain);
	} catch (error) {
		console.error('Explain error:', error);
		res.status(500).json({ message: error.message });
	}
});


/**
 * @swagger
 * /levels/{position}:
 *   get:
 *     summary: Get level by position
 *     tags: [Levels]
 *     parameters:
 *       - in: path
 *         name: position
 *         required: true
 *         schema:
 *           type: integer
 *         description: Position of the level
 *     responses:
 *       200:
 *         description: Level data with accepted records
 *       400:
 *         description: Invalid position
 *       404:
 *         description: Level not found
 *       500:
 *         description: Server error
 */
router.get('/:position', async (req, res) => {
	const position = parseInt(req.params.position, 10);
	if (isNaN(position))
		return res.status(400).json({ message: 'Invalid position' });

	try {
		const q = await db
			.collection('levels')
			.where('position', '==', position)
			.limit(1)
			.get();
		if (q.empty) return res.status(404).json({ message: 'Not found' });

		const levelDoc = q.docs[0];
		const levelId = levelDoc.id;
		const levelData = levelDoc.data();

		const recordsSnap = await db
			.collection('records')
			.where('levelId', '==', levelId)
			.where('status', '==', 'accepted')
			.get();

		const records = await Promise.all(
			recordsSnap.docs.map(async (recordDoc) => {
				const recordData = recordDoc.data();
				const playerSnap = await db
					.doc(`players/${recordData.playerId}`)
					.get();
				const playerName = playerSnap.exists
					? playerSnap.data().name
					: 'Unknown';

				return {
					id: recordDoc.id,
					...recordData,
					player: playerName,
				};
			})
		);
		res.json({
			id: levelId,
			...levelData,
			records,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

/**
 * @swagger
 * /levels:
 *   post:
 *     summary: Add a new level (admin only)
 *     tags: [Levels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, position, creators, video, requirement]
 *             properties:
 *               name:
 *                 type: string
 *               position:
 *                 type: integer
 *               creators:
 *                 type: string
 *               video:
 *                 type: string
 *               requirement:
 *                 type: number
 *     responses:
 *       201:
 *         description: Level added successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Failed to add level
 */
router.post('/', verifyAdmin, async (req, res) => {
	const { name, position, creators, video, requirement } = req.body;
	if (
		!name ||
		position == null ||
		!creators ||
		!video ||
		!requirement
	)
		return res.status(400).json({ message: 'Missing required fields' });

	try {
		const allLevelsSnap = await db.collection('levels').get();
		const levelsCount = allLevelsSnap.size;
		const insertPosition = Math.max(1, Math.min(position, levelsCount + 1));

		const updateQuery = db
			.collection('levels')
			.where('position', '>=', insertPosition);
		const snapshot = await updateQuery.get();

		const batch = db.batch();
		snapshot.forEach((docSnap) => {
			const ref = db.collection('levels').doc(docSnap.id);
			batch.update(ref, { position: docSnap.data().position + 1 });
		});
		await batch.commit();

		await db.collection('levels').add({
			name,
			position: insertPosition,
			creators,
			video,
			requirement,
		});
		res.status(201).json({ message: 'Level added successfully!' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Failed to add level' });
	}
});

/**
 * @swagger
 * /levels/{name}:
 *   delete:
 *     summary: Delete a level by name (admin only)
 *     tags: [Levels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Level deleted and positions updated
 *       404:
 *         description: Level not found
 *       500:
 *         description: Failed to delete level
 */
router.delete('/:name', verifyAdmin, async (req, res) => {
	const levelName = req.params.name;

	try {
		const q = await db
			.collection('levels')
			.where('name', '==', levelName)
			.get();
		if (q.empty)
			return res.status(404).json({ message: 'Level not found' });

		const levelDoc = q.docs[0];
		const levelRef = db.collection('levels').doc(levelDoc.id);
		const deletedPosition = levelDoc.data().position;

		await levelRef.delete();

		const updateSnapshot = await db
			.collection('levels')
			.where('position', '>', deletedPosition)
			.get();
		const batch = db.batch();
		updateSnapshot.forEach((docSnap) => {
			const ref = db.collection('levels').doc(docSnap.id);
			batch.update(ref, { position: docSnap.data().position - 1 });
		});
		await batch.commit();

		return res.json({ message: 'Level deleted and positions updated' });
	} catch (error) {
		console.error('Error deleting level:', error);
		res.status(500).json({ message: 'Failed to delete level' });
	}
});

/**
 * @swagger
 * /levels/{name}/move/{newPosition}:
 *   patch:
 *     summary: Move a level to a new position (admin only)
 *     tags: [Levels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: newPosition
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Level moved successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Level not found
 *       500:
 *         description: Failed to move level
 */
router.patch('/:name/move/:newPosition', verifyAdmin, async (req, res) => {
	const levelName = req.params.name;
	const newPosition = parseInt(req.params.newPosition, 10);

	if (isNaN(newPosition)) {
		return res
			.status(400)
			.json({ message: 'newPosition must be a number' });
	}

	try {
		const q = await db
			.collection('levels')
			.where('name', '==', levelName)
			.get();
		if (q.empty)
			return res.status(404).json({ message: 'Level not found' });

		const levelDoc = q.docs[0];
		const levelRef = db.collection('levels').doc(levelDoc.id);
		const oldPosition = levelDoc.data().position;

		if (oldPosition === newPosition) {
			return res
				.status(200)
				.json({ message: 'Level already at desired position' });
		}

		const levelsRef = db.collection('levels');
		const batch = db.batch();

		if (newPosition < oldPosition) {
			const upSnapshot = await levelsRef
				.where('position', '>=', newPosition)
				.where('position', '<', oldPosition)
				.get();
			upSnapshot.forEach((docSnap) => {
				batch.update(levelsRef.doc(docSnap.id), {
					position: docSnap.data().position + 1,
				});
			});
		} else {
			const downSnapshot = await levelsRef
				.where('position', '>', oldPosition)
				.where('position', '<=', newPosition)
				.get();
			downSnapshot.forEach((docSnap) => {
				batch.update(levelsRef.doc(docSnap.id), {
					position: docSnap.data().position - 1,
				});
			});
		}

		batch.update(levelRef, { position: newPosition });
		await batch.commit();

		return res.json({
			message: `Level "${levelName}" moved from ${oldPosition} to ${newPosition}`,
		});
	} catch (error) {
		console.error('Error moving level:', error);
		return res.status(500).json({ message: 'Failed to move level' });
	}
});

export default router;
