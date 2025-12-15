import OpenAI from "openai";
import { getDB } from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import {v2 as cloudinary} from 'cloudinary';
import pdfTextExtract from "pdf-text-extract";
import fs from "fs";



function extractPdfText(filePath) {
  return new Promise((resolve, reject) => {
    pdfTextExtract(filePath, (err, pages) => {
      if (err) return reject(err);
      resolve(pages.join("\n"));
    });
  });
}

const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
}); //using this we can generate articles, images etc using Gemini API / response of user queries coming from client side


export const generateArticle = async (req, res ) => { 
    try {
        const {userId} = req.auth();
        const {prompt, length} = req.body;
        const plan = req.plan; // free or premium
        const free_usage = req.free_usage; // free usage count for free users

        if(plan !== 'premium' && free_usage >= 10){
            //user already used 10 free  article generations
            return res.json({success: false, message: 'Free usage limit reached. Please upgrade to premium plan.'});
        }

        // proceed to generate article using AI service, ehrn user has premium plan / less than 10 free usagesß   
        const response = await AI.chat.completions.create({
            model: "gemini-2.5-flash-lite",
            messages: [
                {
                    role: "user",
                    content: prompt, //prompt that user has sent from client side
                },
            ],
            temperature: 0.7, //creativity of the response
            max_tokens: length, //length of the article
        }); 
        //get generated article from response (as responses has multiple choices we will get first choice)
        const content = response.choices[0].message.content;
        const sql = getDB();
        //store response in database along with userId
        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'article')`;
        
        if(plan !== 'premium'){
            //increment free usage count for free users
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {free_usage: free_usage + 1}
            });
        }
        res.json({success: true, content}); //send content back to client
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: 'Error generating article', error: error.message});
    }
}

export const generateBlogTitle = async (req, res ) => { 
    try {
        const {userId} = req.auth();
        const {prompt} = req.body;
        const plan = req.plan; // free or premium
        const free_usage = req.free_usage; // free usage count for free users

        if(plan !== 'premium' && free_usage >= 10){
            //user already used 10 free  article generations
            return res.json({success: false, message: 'Free usage limit reached. Please upgrade to premium plan.'});
        }

        // proceed to generate article using AI service, ehrn user has premium plan / less than 10 free usagesß   
        const response = await AI.chat.completions.create({
            model: "gemini-2.5-flash-lite",
            messages: [{ role: "user", content: prompt }], //prompt that user has sent from client side
            temperature: 0.7, //creativity of the response
        }); 
        //get generated article from response (as responses has multiple choices we will get first choice)
        const content = response.choices[0].message.content;
        const sql = getDB();
        //store response in database along with userId
        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;
        
        if(plan !== 'premium'){
            //increment free usage count for free users
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {free_usage: free_usage + 1}
            });
        }
        res.json({success: true, content}); //send content back to client
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: 'Error generating blog title', error: error.message});
    }
}

export const generateImage = async (req, res ) => { 
    try {
        const {userId} = req.auth();
        const {prompt, publish} = req.body; //publish status is either true or false
        const plan = req.plan;

        //this is only for premium users
        if(plan !== 'premium'){
            return res.json({success: false, message: 'Feature avaiable only for premium users'});
        }

        //continue with image generation for premium users

        //using clipdrop api to generate images using text 
        const formData = new FormData();
        formData.append('prompt', prompt);

        const {data} = await axios.post("https://clipdrop-api.co/text-to-image/v1", formData, {
            headers: {'x-api-key': process.env.CLIPDROP_API_KEY}, 
            responseType: 'arraybuffer',
        }) //we get base64 image in response

        const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`
        
        //upload this image to cloud storage cloudinary 
        const {secure_url} =  await cloudinary.uploader.upload(base64Image);
        const sql = getDB();
        //store response in database along with userId
        await sql `INSERT INTO creations (user_id, prompt, content, type, publish) VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;
        
        res.json({success: true, secure_url}); //send content back to client
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: 'Error generating image', error: error.message});
    }
}

export const removeImageBackground = async (req, res ) => { 
    try {
        const {userId} = req.auth();
        const image = req.file; //we will get image file from multer middleware
        const plan = req.plan;

        //this is only for premium users
        if(plan !== 'premium'){
            return res.json({success: false, message: 'Feature avaiable only for premium users'});
        }
        //continue with image background removal for premium users

        //upload this image to cloud storage cloudinary 
        const {secure_url} =  await cloudinary.uploader.upload(image.path, {transformation: [{effect: 'background_removal', backgrounnd_removal: 'remove_the_background'}]});
        const sql = getDB();
        //store response in database along with userId
        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')`;
        
        res.json({success: true, secure_url}); //send content back to client
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: 'Error removing background image', error: error.message});
    }
}

export const removeImageObject = async (req, res ) => { 
    try {
        const {userId} = req.auth();
        const image = req.file; //we will get image file from multer middleware
        const plan = req.plan;
        const {object} = req.body; //object to be removed from image

        //this is only for premium users
        if(plan !== 'premium'){
            return res.json({success: false, message: 'Feature avaiable only for premium users'});
        }
        //continue with image object removal for premium users

        //upload this image to cloud storage cloudinary 
        const {public_id} =  await cloudinary.uploader.upload(image.path);

        const imageUrl = cloudinary.url(public_id, {transformation: [{effect: `gen_remove:${object}`}], recource_type:'image'});
        const sql = getDB();
        //store response in database along with userId
        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${`Remove ${object} from image`}, ${imageUrl}, 'image')`;
        
        res.json({success: true, imageUrl}); //send content back to client
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: 'Error removing object from image', error: error.message});
    }
}

export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth();
    const resume = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "Feature available only for premium users",
      });
    }

    if (resume.size > 5 * 1024 * 1024) {
      return res.json({
        success: false,
        message: "File size should be less than 5MB",
      });
    }

    // ✅ SAFE PDF TEXT EXTRACTION
    const resumeText = await extractPdfText(resume.path);

    const prompt = `Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement:\n\n${resumeText}`;

    const AI = getAI();
    const response = await AI.chat.completions.create({
      model: "gemini-2.5-flash-lite",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    const sql = getDB();

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, 'Review the uploaded resume', ${content}, 'review-resume')
    `;

    return res.json({ success: true, content });
  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: "Error reviewing resume",
      error: error.message,
    });
  }
};
