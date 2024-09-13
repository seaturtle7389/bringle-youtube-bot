const { Events } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
        // grab database objects from the client as set up in main.js
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};