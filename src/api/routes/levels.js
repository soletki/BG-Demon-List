import express from 'express';
import { db } from '../firebase.js';
import { collection, doc, getDocs, query, orderBy, setDoc, where, limit, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import verifyAdmin from '../middleware/verifyAdmin.js';

const router = express.Router();

// GET all levels
router.get('/', async (req, res) => {
	try {
		const q = await getDocs(query(collection(db, 'levels'), orderBy('position')));
		if (q.empty) return res.sendStatus(400);
		res.status(200).send(q.docs.map(doc => doc.data()));
	} catch (error) {
		res.status(500).json({ message: 'Server error' });
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
		res.json({ id: docSnap.id, ...docSnap.data() });
	} catch (error) {
		res.status(500).json({ message: 'Server error' });
	}
});

// POST new level (admin only)
router.post('/', async (req, res) => {
	const { name, position, creators, verifier, video } = req.body;
	if (!name || position == null || !creators || !verifier || !video)
		return res.status(400).json({ message: 'Missing required fields' });

	try {
		const q = query(collection(db, 'levels'), where('position', '>=', position));
		const snapshot = await getDocs(q);
		const updates = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
			.sort((a, b) => b.position - a.position);

		for (const level of updates) {
			const ref = doc(db, 'levels', level.name);
			await updateDoc(ref, { position: level.position + 1 });
		}

		await setDoc(doc(db, 'levels', name), { name, position, creators, verifier, video });
		res.status(201).json({ message: 'Level added successfully!' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Failed to add level' });
	}
});
// DELETE level by name (admin only)
router.delete('/:name', async (req, res) => {
	const levelName = req.params.name;

	try {
		const levelRef = doc(db, 'levels', levelName);
		const levelSnap = await getDoc(levelRef);

		if (!levelSnap.exists()) {
			return res.status(404).json({ message: 'Level not found' });
		}

		const deletedPosition = levelSnap.data().position;

		// Delete the level
		await deleteDoc(levelRef);

		// Fetch and update all levels below the deleted one
		const q = query(collection(db, 'levels'), where('position', '>', deletedPosition));
		const snapshot = await getDocs(q);

		const levelsToUpdate = snapshot.docs.map(docSnap => ({
			id: docSnap.id,
			...docSnap.data()
		}));

		for (const level of levelsToUpdate) {
			const ref = doc(db, 'levels', level.name);
			await updateDoc(ref, { position: level.position - 1 });
		}

		return res.json({ message: 'Level deleted and positions updated' });
	} catch (error) {
		console.error('Error deleting level:', error);
		res.status(500).json({ message: 'Failed to delete level' });
	}
});

router.patch('/:name/move/:newPosition', async (req, res) => {
	const levelName = req.params.name;
	const newPosition = parseInt(req.params.newPosition, 10);

	if (isNaN(newPosition)) {
		return res.status(400).json({ message: 'newPosition must be a number' });
	}

	try {
		// Get the level
		const levelRef = doc(db, 'levels', levelName);
		const levelSnap = await getDoc(levelRef);

		if (!levelSnap.exists()) {
			return res.status(404).json({ message: 'Level not found' });
		}

		const oldPosition = levelSnap.data().position;

		if (oldPosition === newPosition) {
			return res.status(200).json({ message: 'Level already at desired position' });
		}

		const levelsRef = collection(db, 'levels');

		// Moving up (to a lower number)
		if (newPosition < oldPosition) {
			const q = query(
				levelsRef,
				where('position', '>=', newPosition),
				where('position', '<', oldPosition)
			);
			const snapshot = await getDocs(q);
			for (const docSnap of snapshot.docs) {
				const ref = doc(db, 'levels', docSnap.data().name);
				await updateDoc(ref, { position: docSnap.data().position + 1 });
			}
		}

		// Moving down (to a higher number)
		else {
			const q = query(
				levelsRef,
				where('position', '>', oldPosition),
				where('position', '<=', newPosition)
			);
			const snapshot = await getDocs(q);
			for (const docSnap of snapshot.docs) {
				const ref = doc(db, 'levels', docSnap.data().name);
				await updateDoc(ref, { position: docSnap.data().position - 1 });
			}
		}

		// Update the moved level
		await updateDoc(levelRef, { position: newPosition });

		return res.json({ message: `Level moved from ${oldPosition} to ${newPosition}` });
	} catch (error) {
		console.error('Error moving level:', error);
		return res.status(500).json({ message: 'Failed to move level' });
	}
});


export default router;
