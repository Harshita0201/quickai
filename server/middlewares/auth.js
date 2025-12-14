import { clerkClient } from "@clerk/express";
//middleware to check userID and hasPremiumPlan status

export const auth = async (req, res, next) => {
    try {
        const {userId, has} = await req.auth(); // get userID from req.auth object provided by clerk middleware
        const hasPremiumPlan = await has({plan: 'premium'}); //if user has premium plan it will be true else false
        
        const user = await clerkClient.users.getUser(userId); // fetch user details from clerk

        if(!hasPremiumPlan && user.privateMetadata.free_usage){ //if user does not have premium plan & he has free usage metadata
            req.free_usage = user.privateMetadata.free_usage; // set free usage in req object
        }else{ //if user does not have free usage metadata, add freeusage metadata
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {free_usage: 0}
        })
        req.free_usage = 0;
      }
        req.plan = hasPremiumPlan ? 'premium' : 'free'; // set plan in req object
        next(); // proceed to next middleware or route handler
    } catch (error) {
        res.json({success: false, message: 'Error in auth middleware', error: error.message});
    }
}