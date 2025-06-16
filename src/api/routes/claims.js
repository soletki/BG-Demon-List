import express from 'express';
import { db } from '../firebase.js';
import verifyAdmin from '../middleware/verifyAdmin.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Claims
 *   description: Handle user claims on player profiles
 */

/**
 * @swagger
 * /claims:
 *   post:
 *     summary: Create a new claim
 *     tags: [Claims]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - playerId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "abc123"
 *               playerId:
 *                 type: string
 *                 example: "def456"
 *     responses:
 *       200:
 *         description: Claim created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 */

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

/**
 * @swagger
 * /claims:
 *   get:
 *     summary: Get all claims with player and user names
 *     tags: [Claims]
 *     responses:
 *       200:
 *         description: List of claims
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   claimId:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   playerId:
 *                     type: string
 *                   userName:
 *                     type: string
 *                     nullable: true
 *                   playerName:
 *                     type: string
 *                     nullable: true
 *       500:
 *         description: Internal server error
 */

router.get('/', async (req, res) => {
	try {
        const snapshot = await db
            .collection('claims')
            .get();

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
                claimId: doc.id,
                playerName: playerName,
                userName: userName,
            };
        }));

        res.status(200).send(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /claims/{claimId}:
 *   delete:
 *     summary: Delete a claim by ID
 *     tags: [Claims]
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the claim to delete
 *     responses:
 *       200:
 *         description: Claim deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Claim not found
 *       500:
 *         description: Error deleting claim
 */

router.delete('/:claimId', async (req, res) => {
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
