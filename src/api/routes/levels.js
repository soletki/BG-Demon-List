import express from 'express';
import { db } from '../firebase.js';
import { collection, doc, getDocs, query, orderBy, setDoc, where, limit, updateDoc } from 'firebase/firestore';
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

// POST new level
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

export default router;
