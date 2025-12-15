import OpenAI from "openai";
import { getDB } from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import pdfTextExtract from "pdf-text-extract";
import fs from "fs";

/* ------------------------------------------------------------------
   SAFE PDF TEXT EXTRACTION (NO DOM / NO CANVAS)
------------------------------------------------------------------- */
function extractPdfText(filePath) {
  return new Promise((resolve, reject) => {
    pdfTextExtract(filePath, (err, pages) => {
      if (err) return reject(err);
      resolve(pages.join("\n"));
    });
  });
}

/* ------------------------------------------------------------------
   SAFE, LAZY OPENAI / GEMINI CLIENT
------------------------------------------------------------------- */
let AI;

function getAI() {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY / OPENAI_API_KEY environment variable"
    );
  }

  if (!AI) {
    AI = new OpenAI({
      apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
  }

  return AI;
}

/* ------------------------------------------------------------------
   ARTICLE GENERATION
------------------------------------------------------------------- */
export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Free usage limit reached. Please upgrade to premium plan.",
      });
    }

    const AI = getAI();
    const response = await AI.chat.completions.create({
      model: "gemini-2.5-flash-lite",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: length,
    });

    const content = response.choices[0].message.content;
    const sql = getDB();

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'article')
    `;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    return res.json({ success: true, content });
  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: "Error generating article",
      error: error.message,
    });
  }
};

/* ------------------------------------------------------------------
   BLOG TITLE GENERATION
------------------------------------------------------------------- */
export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Free usage limit reached. Please upgrade to premium plan.",
      });
    }

    const AI = getAI();
    const response = await AI.chat.completions.create({
      model: "gemini-2.5-flash-lite",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    const sql = getDB();

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'blog-title')
    `;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    return res.json({ success: true, content });
  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: "Error generating blog title",
      error: error.message,
    });
  }
};

/* ------------------------------------------------------------------
   IMAGE GENERATION
------------------------------------------------------------------- */
export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "Feature available only for premium users",
      });
    }

    const formData = new FormData();
    formData.append("prompt", prompt);

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: { "x-api-key": process.env.CLIPDROP_API_KEY },
        responseType: "arraybuffer",
      }
    );

    const base64Image = `data:image/png;base64,${Buffer.from(
      data,
      "binary"
    ).toString("base64")}`;

    const { secure_url } = await cloudinary.uploader.upload(base64Image);
    const sql = getDB();

    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})
    `;

    return res.json({ success: true, secure_url });
  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: "Error generating image",
      error: error.message,
    });
  }
};
export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const image = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "Feature available only for premium users",
      });
    }

    if (!image) {
      return res.json({
        success: false,
        message: "No image file uploaded",
      });
    }

    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [
        {
          effect: "background_removal",
        },
      ],
    });

    const sql = getDB();

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')
    `;

    return res.json({
      success: true,
      secure_url,
    });
  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: "Error removing background image",
      error: error.message,
    });
  }
};

export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const image = req.file;
    const plan = req.plan;
    const { object } = req.body;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "Feature available only for premium users",
      });
    }

    if (!image) {
      return res.json({
        success: false,
        message: "No image file uploaded",
      });
    }

    if (!object) {
      return res.json({
        success: false,
        message: "Object to remove is required",
      });
    }

    const { public_id } = await cloudinary.uploader.upload(image.path);

    const imageUrl = cloudinary.url(public_id, {
      transformation: [
        {
          effect: `gen_remove:${object}`,
        },
      ],
      resource_type: "image",
    });

    const sql = getDB();

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (
        ${userId},
        ${`Remove ${object} from image`},
        ${imageUrl},
        'image'
      )
    `;

    return res.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: "Error removing object from image",
      error: error.message,
    });
  }
};


/* ------------------------------------------------------------------
   RESUME REVIEW (PDF TEXT → AI)
------------------------------------------------------------------- */
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
