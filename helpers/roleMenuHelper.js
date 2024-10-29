const envFileName = `.env.${process.env.APP_ENV || "development"}`
require('dotenv').config({ path: envFileName });

async function createRoleMenu(client, type, guild_id, channel_id, message_id, title, text){
    var RoleMenu = client.RoleMenu
    var  roleMenu = await RoleMenu.findOne({where: {message_id: message_id}});
    if (!roleMenu) {
        try{
            var newRoleMenu = await RoleMenu.create({
                type: type,
                guild_id: guild_id,
                channel_id: channel_id,
                message_id: message_id,
                title: title,
                text: text
            })
            console.log(`Role Menu (type: ${type}) was added`)
            return newRoleMenu;    
        }
        catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError'){
                console.log("Role Menu already exists")
            } else {
                console.log("Something went wrong when adding a Role Menu")
                console.log(error);
            }
        }  
    } else {
        console.log("Role Menu has already been added")
    }
    return null;
}

async function updateRoleMenu(client, role_menu_id, type, title, text){
    var RoleMenu = client.RoleMenu
    var  roleMenu = await RoleMenu.findByPk(role_menu_id);
    if (roleMenu) {
        try{
            var roleMenu = await roleMenu.update({
                type: type,
                title: title,
                text: text
            })
            console.log(`Role Menu was updated`)
            return roleMenu;    
        }
        catch (error) {
            console.log("Something went wrong when updating a Role Menu")
            console.log(error);
        }  
    } else {
        console.log("Role Menu doesn't exist")
    }
    return null;
}

async function deleteRoleMenu(client, role_menu_id){
    var RoleMenu = client.RoleMenu;
    var roleMenu = await RoleMenu.findByPk(role_menu_id);
    if (roleMenu) {
        try{
            roleMenu.destroy();
            console.log("Role menu was deleted")
            return true;
        }
        catch (error) {  
            console.log(`Something went wrong when deleting role menu ${role_menu_id}`)
        }  
    } else {
        console.log("Role menu does not exist")
    }
    return false;
}

module.exports = {
    createRoleMenu, updateRoleMenu, deleteRoleMenu
}