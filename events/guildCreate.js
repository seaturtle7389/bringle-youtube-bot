const { Events } = require('discord.js');
const guildHelper = require('../helpers/serverGuildHelper')

module.exports = {
	name: Events.GuildCreate,
	async execute(guild) {
        // add guild info to the database if it doesn't already exist
		console.log(`Added to ${guild.name}! Adding guild to database.`);
        await guildHelper.createServerGuild(guild.client, guild.id);
	},
};