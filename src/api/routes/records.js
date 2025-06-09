import express from 'express';
import { db } from '../firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import verifyAdmin from '../middleware/verifyAdmin.js';
const router = express.Router();

router.post('/', verifyAdmin, async (req, res) => {
    const { playerId, levelId, progress, video } = req.body;

	if (!playerId || !levelId || !progress || !video)
		return res.status(400).json({ message: 'Missing required fields' });

    try{
        await db.collection("records").add({
            playerId,
            levelId,
            progress,
            video,
            date: FieldValue.serverTimestamp(),
            status: "pending"
        });
        res.status(201).json({ message: 'Record added successfully!' });
    }catch (error){
        console.error(error);
		res.status(500).json({ message: error.message });
    }
})

router.get('/', async (req, res) => {
    try {
		const snapshot = await db
			.collection('records')
			.orderBy('date')
			.get();
		if (snapshot.empty) return res.sendStatus(400);
		res.status(200).send(snapshot.docs.map((doc) => doc.data()));
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
})

router.patch('/:recordId/:status', async (req,res) => {
    const recordId = req.params.recordId;
    const status = req.params.status;

    try{
        await db.collection("records").doc(recordId).update({
            status: status
        })
        res.status(200).json({ message: 'Status updated successfully' });
    }catch (error) {
		res.status(500).json({ message: error.message });
	}
})

export default router;
