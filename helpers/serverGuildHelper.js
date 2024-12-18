async function createServerGuild(client, guildId) {
    var ServerGuild = client.ServerGuild
    var  clientGuild = await ServerGuild.findByPk(guildId);
    if (!clientGuild) {
        try{
            var newServerGuild = await ServerGuild.create({
                id: guildId
            })
            console.log("Guild was added")
        }
        catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError'){
                console.log("Guild already exists")
            } else {
                console.log("Something went wrong when adding a guild")
            }
        }  
    } else {
        console.log("Guild has already been added")
    }
}

async function deleteServerGuild(client, guildId) {
    var ServerGuild = client.ServerGuild
    var  clientGuild = await ServerGuild.findByPk(guildId);
    if (clientGuild) {
        try{
            clientGuild.destroy();
            console.log("Guild was deleted")
        }
        catch (error) {  
            console.log(`Something went wrong when deleting guild ${guildId}`)
        }  
    } else {
        console.log("Guild does not exist")
    }
}

module.exports = {
    createServerGuild, deleteServerGuild
}