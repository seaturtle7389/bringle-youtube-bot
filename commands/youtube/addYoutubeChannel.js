const envFileName = `.env.${process.env.APP_ENV || "development"}`
require('dotenv').config({ path: envFileName });
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const youtubeChannelHelper = require('../../helpers/youtubeChannelHelper');
const youtubeFetchTimeout = process.env.YOUTUBE_FETCH_INTERVAL / 60 / 1000;

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('add-youtube-channel')
		.setDescription('Adds a YouTube channel to the bot')
		.addStringOption(option =>
			option
				.setName('yt_handle')
				.setDescription('The handle for the YouTube account you want to monitor')
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName('nickname')
				.setDescription('The name you want to assign to this channel for reference')
				.setRequired(true)
		)
		.addIntegerOption(option =>
			option
				.setName('video_check_interval')
				.setDescription(`how long to wait in minutes before checking for new videos (defaults to the bot's minimum of  ${youtubeFetchTimeout})`)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.setContexts([0]),
	async execute(interaction) {
		var yt_handle = interaction.options.getString('yt_handle');
		var nickname = interaction.options.getString('nickname');
		var video_check_interval = interaction.options.getInteger('video_check_interval');
		var guild = interaction.guild;
		var YoutubeChannel = interaction.client.YoutubeChannel
		
		// everything we do later might take a little bit, so defer the reply
		await interaction.deferReply();

		var  existingYoutubeChannel = await YoutubeChannel.findOne({where: {guild_id: guild.id, youtube_handle: yt_handle}});
		if (!existingYoutubeChannel) {
					// make sure the channel exists before we add it to the database
			yt_channel_id = await youtubeChannelHelper.getYoutubeChannelIdFromHandle(yt_handle);
			if(yt_channel_id == null){
				await interaction.followUp(`**YouTube channel with the ID ${yt_channel_id} does not exist.**`);
				return;
			}

			var newYoutubeChannel = await youtubeChannelHelper.createYoutubeChannel(interaction.client, nickname, guild.id, yt_channel_id, yt_handle, video_check_interval)
			if (newYoutubeChannel){
				await interaction.followUp(`**YouTube channel "${newYoutubeChannel.name}" was added!**`);
			} else {
				await interaction.followUp(`**YouTube channel "${nickname}" was not added due to an unexpected error.**`);
			}
		} else {
			var responseString = '';
			if(nickname != existingYoutubeChannel.name || video_check_interval != existingYoutubeChannel.video_check_interval){
				existingYoutubeChannel = await existingYoutubeChannel.update({
					name: nickname,
					video_check_interval: video_check_interval
				})
				responseString += `**The YouTube channel was updated!**`;
			} else{
				//if nothing was changed
				responseString = '**A YouTube channel already exists with this exact same information.** Did you mean to run this command?'
			}
			
			await interaction.followUp(responseString.replace(/^\s+|\s+$/g, ""));
		}
	},
};