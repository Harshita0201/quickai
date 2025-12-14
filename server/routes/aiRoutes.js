//api endpioints related to AI functionalities
import express from 'express';
import {auth} from '../middlewares/auth.js';

import { generateArticle, generateBlogTitle, generateImage, removeImageBackground, removeImageObject, resumeReview } from '../controllers/aiController.js';
import { upload } from '../configs/multer.js';

const aiRouter = express.Router(); // create router for ai related routes

aiRouter.post('/generate-article', auth, generateArticle); //middlerware for authentication & endpoint to generate article using AI
aiRouter.post('/generate-blog-title', auth, generateBlogTitle); 
aiRouter.post('/generate-image', auth, generateImage);
aiRouter.post('/remove-image-background', upload.single('image'), auth, removeImageBackground);
// route to remove an object from an uploaded image (expects field name 'image')
aiRouter.post('/remove-image-object', upload.single('image'), auth, removeImageObject);
aiRouter.post('/resume-review', upload.single('resume'), auth, resumeReview);

export default aiRouter;