const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
		.setContexts([0]),
	async execute(interaction) {
		await interaction.reply({content: 'Pong!', ephemeral: true });
	},
};