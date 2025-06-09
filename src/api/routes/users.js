import express from 'express';
import { db } from '../firebase.js';
const router = express.Router();

router.post('/', async (req, res) => {
	const { username, uid } = req.body;

	if (!username || !uid)
		return res.status(400).json({ message: 'Missing required fields' });

    try{
        await db.collection("users").doc(uid).set({
            name: username,
            playerId: null,
            isAdmin: false,
        });
        res.status(201).json({ message: 'User added successfully!' });
    }catch (error){
        console.error(error);
		res.status(500).json({ message: error.message });
    }

});

export default router;
