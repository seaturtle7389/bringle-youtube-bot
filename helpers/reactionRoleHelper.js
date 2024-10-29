const envFileName = `.env.${process.env.APP_ENV || "development"}`
require('dotenv').config({ path: envFileName });

async function createReactionRole(client, menu_id, role_id, emoji_id, name){
    var ReactionRole = client.ReactionRole
    var  reactionRole = await ReactionRole.findOne({where: {role_id: role_id}});
    if (!reactionRole) {
        try{
            var newReactionRole = await ReactionRole.create({
                role_menu_id: menu_id,
                role_id: role_id,
                emoji_id: emoji_id,
                name: name
            })
            console.log(`Reaction Role was added`)
            return newReactionRole;    
        }
        catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError'){
                console.log("Reaction Role already exists")
            } else {
                console.log("Something went wrong when adding a Reaction Role")
                console.log(error);
            }
        }  
    } else {
        console.log("Reaction Role has already been added")
    }
    return null;
}

async function deleteReactionRole(client, reaction_role_id){
    var ReactionRole = client.ReactionRole
    var  reactionRole = await ReactionRole.findByPk(reaction_role_id);
    if (reactionRole) {
        try{
            reactionRole.destroy();
            console.log("Reaction Role was deleted")
            return true;
        }
        catch (error) {  
            console.log(`Something went wrong when deleting reaction role ${reaction_role_id}`)
        }  
    } else {
        console.log("Reaction Role does not exist")
    }
    return false;
}

async function updateReactionRole(client, reaction_role_id, name, emoji_id){
    var ReactionRole = client.ReactionRole
    var  reactionRole = await ReactionRole.findByPk(reaction_role_id);
    if (reactionRole) {
        try{
            reactionRole = reactionRole.update({
                name: name,
                emoji_id: emoji_id
            });
            console.log("Reaction Role was updated")
            return reactionRole;
        }
        catch (error) {  
            console.log(`Something went wrong when updating reaction role ${reaction_role_id}`)
        }  
    } else {
        console.log("Reaction Role does not exist")
    }
    return false;
}

module.exports = {
    createReactionRole, deleteReactionRole, updateReactionRole
}