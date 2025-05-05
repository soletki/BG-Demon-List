import express from 'express';
import { collection, doc, getDocs, query, orderBy, setDoc } from 'firebase/firestore';
import { db } from './firebase.js';

const app = express();
const port = 3000;

app.use(express.json());

async function verifyAdmin(req, res, next) {
	const userId = req.body.userId;
	if (!userId) {
		return res.status(400).json({ message: 'User ID is required' });
	}

	try {
		const userRef = doc(db, 'users', userId);
		const userSnap = await getDoc(userRef);

		if (userSnap.exists() && userSnap.data().isAdmin) {
			next();
		} else {
			return res.status(403).json({
				message: 'You are not authorized to perform this action',
			});
		}
	} catch (error) {
		console.error('Error verifying admin: ', error);
		return res
			.status(500)
			.json({ message: 'Error verifying admin status' });
	}
}

app.get('/levels', async (req, res) => {
	const q = await getDocs(
		query(collection(db, 'levels'), orderBy('position'))
	);
	if (q.empty) {
		return res.sendStatus(400);
	}
	res.status(200).send(q.docs.map((doc) => doc.data()));
});

app.post('/levels', async (req, res) => {
	const { name, position, creators, verifier, video, userId } =
		req.body;

	if (
		!name ||
		!position ||
		!creators ||
		!verifier ||
		!video
	) {
		return res.status(400).json({ message: 'Missing required fields' });
	}

	try {
		await setDoc(doc(db, 'levels', name), {
			name: name,
			position: position,
			creators: creators,
			verifier: verifier,
			video: video,
		});

		return res
			.status(201)
			.json({ message: 'Demon added successfully!' });
	} catch (error) {
		console.error('Error adding demon: ', error);
		return res.status(500).json({ message: 'Failed to add demon' });
	}
});

app.listen(port, () => {
	console.log(`Server has started on https://localhost:${port}`);
});
