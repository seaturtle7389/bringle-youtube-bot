const { Events } = require('discord.js');
const guildHelper = require('../helpers/serverGuildHelper')

module.exports = {
	name: Events.GuildDelete,
	async execute(guild) {
        // remove guild from database if the bot is kicked
		console.log(`Removed from ${guild.name}! Deleting guild from database.`);
        await guildHelper.deleteServerGuild(guild.client, guild.id);
	},
};