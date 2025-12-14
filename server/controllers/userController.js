import { use } from "react";
import sql from "../configs/db.js";

export const getUserCreations = async (req, res) => {
    try {
        const {userId} = req.auth();

        const creations = await sql `SELECT * FROM creations WHERE user_id = ${userId} ORDER BY created_at DESC`;

        res.json({success: true, creations});

    } catch (error) {
        res.json({success: false, messeage: error.message});
    }
}

export const getPublishedCreations = async (req, res) => {
    try {
    
        const creations = await sql `SELECT * FROM creations WHERE publish = true ORDER BY created_at DESC`;

        res.json({success: true, creations});

    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

export const toggleLikeCreation = async (req, res) => {
    try {
        const {userId} = req.auth();

        const {id} = req.body; //creation id - for which we will like like/ dislike
        
        const [creations] = await sql `SELECT * FROM creations WHERE id = ${id}`;
        
        if(!creations){
            return res.json({success: false, message: 'Creation not found'});
        }
        //creations found 
        const currentLikes = creations.likes;
        const userIdStr = userId.toString();
        let updatedLikes;
        let message;

        if(currentLikes.includes(userIdStr)){
            //user has already liked the creation, so remove like (dislike)
            updatedLikes = currentLikes.filter((uid) => uid !== userIdStr);
            message = 'Creation disliked successfully';
        }else{
            //user has not liked the creation, so add like
            updatedLikes = [...currentLikes, userIdStr];
            message = 'Creation liked successfully';
        }

        const formattedArray = `{${updatedLikes.join(',')}}`;  //format array to store in postgres

        //update the data in database
        await sql `UPDATE creations SET likes = ${formattedArray}::text[] WHERE id = ${id}`;

        res.json({success: true, message});

    } catch (error) {
        res.json({success: false , messeage: error.message});
    }
}