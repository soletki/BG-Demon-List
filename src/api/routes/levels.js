import express from 'express';
import { db } from '../firebase.js';
import verifyAdmin from '../middleware/verifyAdmin.js';

const router = express.Router();

// GET all levels
router.get('/', async (req, res) => {
	try {
		const snapshot = await db
			.collection('levels')
			.orderBy('position')
			.get();

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


// GET level by position
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

// POST new level (admin only)
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

// DELETE level by name (admin only)
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
