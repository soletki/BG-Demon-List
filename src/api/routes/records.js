import express from 'express';
import { db } from '../firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import verifyAdmin from '../middleware/verifyAdmin.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Player record submissions and moderation
 */

/**
 * @swagger
 * /records:
 *   post:
 *     summary: Submit a new record
 *     tags: [Records]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [playerId, levelId, progress, video]
 *             properties:
 *               playerId:
 *                 type: string
 *               levelId:
 *                 type: string
 *               progress:
 *                 type: number
 *               video:
 *                 type: string
 *     responses:
 *       201:
 *         description: Record submitted successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
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
            status: "pending",
        });
        res.status(201).json({ message: 'Record added successfully!' });
    }catch (error){
        console.error(error);
		res.status(500).json({ message: error.message });
    }
})

/**
 * @swagger
 * /records:
 *   get:
 *     summary: Get all submitted records
 *     tags: [Records]
 *     responses:
 *       200:
 *         description: List of all records
 *       400:
 *         description: No records found
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const snapshot = await db
            .collection('records')
            .orderBy('date')
            .get();

        if (snapshot.empty) return res.sendStatus(400);

        const records = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();

            let playerName = null;
            if (data.playerId) {
                const playerDoc = await db.collection('players').doc(data.playerId).get();
                playerName = playerDoc.exists ? playerDoc.data().name : null;
            }

            let levelName = null;
            if (data.levelId) {
                const levelDoc = await db.collection('levels').doc(data.levelId).get();
                levelName = levelDoc.exists ? levelDoc.data().name : null;
            }

            return {
                id: doc.id,
                ...data,
                playerName: playerName,
                levelName: levelName,
            };
        }));

        res.status(200).send(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /records/{playerId}:
 *   get:
 *     summary: Get records by player ID
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the player
 *     responses:
 *       200:
 *         description: List of records by player
 *       500:
 *         description: Server error
 */
router.get('/:playerId', async (req, res) => {
    const playerIdParm = req.params.playerId;

    try {
        const snapshot = await db
            .collection('records')
            .where('playerId', '==', playerIdParm)
            .orderBy('date')
            .get();


        const records = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();

            let playerName = null;
            if (data.playerId) {
                const playerDoc = await db.collection('players').doc(data.playerId).get();
                playerName = playerDoc.exists ? playerDoc.data().name : null;
            }

            let levelName = null;
            let position = 0;
            if (data.levelId) {
                const levelDoc = await db.collection('levels').doc(data.levelId).get();
                levelName = levelDoc.exists ? levelDoc.data().name : null;
                position = levelDoc.exists ? levelDoc.data().position : 0;
            }

            return {
                id: doc.id,
                ...data,
                position: position,
                playerName: playerName,
                levelName: levelName,
            };
        }));

        res.status(200).send(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /records/{recordId}/{status}:
 *   patch:
 *     summary: Update the status of a record (admin only)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the record
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: New status (e.g. accepted, rejected)
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       500:
 *         description: Server error
 */
router.patch('/:recordId/:status', verifyAdmin, async (req,res) => {
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
