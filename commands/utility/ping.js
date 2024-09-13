const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!')
		//.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setContexts([0]),
	async execute(interaction) {
		const init = require('../../main.js')
		await init.createServerGuildIfNotExists(interaction.client, interaction.guild.id);
		await interaction.reply('Pong!');
	},
};