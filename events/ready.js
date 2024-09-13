const { Events } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
        // grab database objects from the client as set up in main.js
        const ServerGuilds = client.ServerGuilds
		ServerGuilds.sync();
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};