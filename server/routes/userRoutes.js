import express from 'express';
import { auth } from '../middlewares/auth.js';
import { getUserCreations, getPublishedCreations, toggleLikeCreation } from '../controllers/userController.js';


const userRouter = express.Router(); // create router for user related routes

userRouter.get('/get-user-creations', auth, getUserCreations); //endpoint to get creations of logged in user
userRouter.get('/get-published-creations', auth, getPublishedCreations);
userRouter.post('/toggle-like-creations', auth, toggleLikeCreation);

export default userRouter;
