import express from 'express';
import { db } from '../firebase.js';
import { collection, doc, getDocs, query, orderBy, setDoc, where, limit, updateDoc, getDoc, deleteDoc, addDoc } from 'firebase/firestore';
import verifyAdmin from '../middleware/verifyAdmin.js';

const router = express.Router();

// GET all levels
router.get('/', async (req, res) => {
	try {
		const q = await getDocs(query(collection(db, 'levels'), orderBy('position')));
		if (q.empty) return res.sendStatus(400);
		res.status(200).send(q.docs.map(doc => doc.data()));
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

// GET level by position
router.get('/:position', async (req, res) => {
	const position = parseInt(req.params.position, 10);
	if (isNaN(position)) return res.status(400).json({ message: 'Invalid position' });

	try {
		const q = query(collection(db, 'levels'), where('position', '==', position), limit(1));
		const snapshot = await getDocs(q);
		if (snapshot.empty) return res.status(404).json({ message: 'Not found' });

		const docSnap = snapshot.docs[0];
		const levelId = docSnap.id;
		const levelData = docSnap.data();

		// Fetch records related to this level
		const recordsSnap = await getDocs(
			query(collection(db, 'records'), where('levelId', '==', levelId))
		);

		const records = recordsSnap.docs.map(doc => ({
			id: doc.id,
			...doc.data(),
		}));

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
	const { name, position, creators, verifier, video } = req.body;
	if (!name || position == null || !creators || !verifier || !video)
		return res.status(400).json({ message: 'Missing required fields' });

	try {
		const q = query(collection(db, 'levels'), where('position', '>=', position));
		const snapshot = await getDocs(q);
		const updates = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
			.sort((a, b) => b.position - a.position);

		for (const level of updates) {
			const ref = doc(db, 'levels', level.id);
			await updateDoc(ref, { position: level.position + 1 });
		}

		await addDoc(collection(db, 'levels'), { name, position, creators, verifier, video });
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
		// Find the level by name
		const q = query(collection(db, 'levels'), where('name', '==', levelName));
		const snapshot = await getDocs(q);

		if (snapshot.empty) {
			return res.status(404).json({ message: 'Level not found' });
		}

		const levelDoc = snapshot.docs[0];
		const levelRef = doc(db, 'levels', levelDoc.id);
		const deletedPosition = levelDoc.data().position;

		// Delete the level
		await deleteDoc(levelRef);

		// Fetch and update all levels below the deleted one
		const updateQuery = query(collection(db, 'levels'), where('position', '>', deletedPosition));
		const updateSnapshot = await getDocs(updateQuery);

		for (const docSnap of updateSnapshot.docs) {
			await updateDoc(doc(db, 'levels', docSnap.id), {
				position: docSnap.data().position - 1,
			});
		}

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
		return res.status(400).json({ message: 'newPosition must be a number' });
	}

	try {
		// Find the level by name
		const q = query(collection(db, 'levels'), where('name', '==', levelName));
		const snapshot = await getDocs(q);

		if (snapshot.empty) {
			return res.status(404).json({ message: 'Level not found' });
		}

		const levelDoc = snapshot.docs[0];
		const levelRef = doc(db, 'levels', levelDoc.id);
		const oldPosition = levelDoc.data().position;

		if (oldPosition === newPosition) {
			return res.status(200).json({ message: 'Level already at desired position' });
		}

		const levelsRef = collection(db, 'levels');

		// Moving up
		if (newPosition < oldPosition) {
			const upQuery = query(
				levelsRef,
				where('position', '>=', newPosition),
				where('position', '<', oldPosition)
			);
			const upSnapshot = await getDocs(upQuery);
			for (const docSnap of upSnapshot.docs) {
				await updateDoc(doc(db, 'levels', docSnap.id), {
					position: docSnap.data().position + 1,
				});
			}
		}

		// Moving down
		else {
			const downQuery = query(
				levelsRef,
				where('position', '>', oldPosition),
				where('position', '<=', newPosition)
			);
			const downSnapshot = await getDocs(downQuery);
			for (const docSnap of downSnapshot.docs) {
				await updateDoc(doc(db, 'levels', docSnap.id), {
					position: docSnap.data().position - 1,
				});
			}
		}

		// Finally, update the moved level
		await updateDoc(levelRef, { position: newPosition });

		return res.json({
			message: `Level "${levelName}" moved from ${oldPosition} to ${newPosition}`,
		});
	} catch (error) {
		console.error('Error moving level:', error);
		return res.status(500).json({ message: 'Failed to move level' });
	}
});


export default router;
