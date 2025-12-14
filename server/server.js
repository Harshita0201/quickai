import express from 'express';
import cors from 'cors';
import { clerkMiddleware, requireAuth } from '@clerk/express'
import aiRouter from './routes/aiRoutes.js';
import userRouter from './routes/userRoutes.js';
import connectCloudinary from './configs/cloudinary.js';
import 'dotenv/config';

const app = express();
await connectCloudinary();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware()); // all requests through -clerk Middleware to verify Clerk authentication

app.get('/', (req, res) =>{
    res.send('server is running....');
})

app.use(requireAuth()); // protect all routes below this line with this middleware, only logged in users can access these routes

app.use('/api/ai', aiRouter); //routes related to AI functionalities
app.use('/api/user', userRouter); //routes related to user functionalities

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
})