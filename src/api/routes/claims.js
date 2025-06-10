import express from 'express';
import { db } from '../firebase.js';
import verifyAdmin from '../middleware/verifyAdmin.js';
const router = express.Router();

router.post('/', async (req, res) => {
	const { userId, playerId } = req.body;

	try {
		await db.collection('claims').add({
			userId,
			playerId,
		});
		res.status(200).json({
			message: 'Claim created successfully',
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

router.get('/', async (req, res) => {
	try {
        const snapshot = await db
            .collection('claims')
            .get();

        if (snapshot.empty) return res.sendStatus(400);

        const records = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();

            let playerName = null;
            if (data.playerId) {
                const playerDoc = await db.collection('players').doc(data.playerId).get();
                playerName = playerDoc.exists ? playerDoc.data().name : null;
            }

            let userName = null;
            if (data.userId) {
                const userDoc = await db.collection('users').doc(data.userId).get();
                userName = userDoc.exists ? userDoc.data().name : null;
            }

            return {
                ...data,
                playerName: playerName,
                userName: userName,
            };
        }));

        res.status(200).send(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/claims/:claimId', verifyAdmin, async (req, res) => {
	const { claimId } = req.params;

	try {
		const claimRef = db.collection('claims').doc(claimId);
		const doc = await claimRef.get();

		if (!doc.exists) {
			return res.status(404).json({ error: 'Claim not found' });
		}

		await claimRef.delete();

		res.status(200).json({ message: 'Claim deleted successfully' });
	} catch (error) {
		console.error('Error deleting claim:', error);
		res.status(500).json({ error: error.message });
	}
});


export default router;
