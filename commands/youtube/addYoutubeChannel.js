const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('addyoutubechannel')
		.setDescription('Adds a YouTube channel to watch for notifications')
		.addStringOption(option =>
			option
				.setName('yt_channel_id')
				.setDescription('The channel ID for the YouTube account you want to monitor')
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName('nickname')
				.setDescription('The name you want to assign to this channel for reference')
				.setRequired(true)
		)
		.addChannelOption(option =>
			option
				.setName('live_notif_channel')
				.setDescription('The Discord channel the bot will post in when this YouTube account goes live')
		)
		.addChannelOption(option =>
			option
				.setName('upload_notif_channel')
				.setDescription('The Discord channel the bot will post in when this YouTube account posts a new video')
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.setContexts([0]),
	async execute(interaction) {
		const guildHelper = require('../../helpers/serverGuildHelpers')
		await guildHelper.createServerGuildIfNotExists(interaction.client, interaction.guild.id);
		await interaction.reply('Pong!');
	},
};