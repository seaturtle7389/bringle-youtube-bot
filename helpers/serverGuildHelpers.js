async function createServerGuildIfNotExists(client, guildId) {
    const serverGuild = client.ServerGuild
    var  clientGuild = await ServerGuild.findOne({where: {id: guildId}});
    if (!clientGuild) {
        try{
            const newServerGuild = await ServerGuild.create({
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

module.exports = {
    createServerGuildIfNotExists
}