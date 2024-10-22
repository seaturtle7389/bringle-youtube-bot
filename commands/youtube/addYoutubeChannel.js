const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const youtubeChannelHelper = require('../../helpers/youtubeChannelHelper')

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('addyoutubechannel')
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
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.setContexts([0]),
	async execute(interaction) {
		var yt_handle = interaction.options.getString('yt_handle');
		var nickname = interaction.options.getString('nickname');
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

			var newYoutubeChannel = await youtubeChannelHelper.createYoutubeChannel(interaction.client, nickname, guild.id, yt_channel_id, yt_handle)
			if (newYoutubeChannel){
				await interaction.followUp(`**YouTube channel "${newYoutubeChannel.name}" was added!**`);
			} else {
				await interaction.followUp(`**YouTube channel "${nickname}" was not added due to an unexpected error.**`);
			}
		} else {
			if(nickname != existingYoutubeChannel.name){
				existingYoutubeChannel = await existingYoutubeChannel.update({
					name: nickname,
				})
				responseString += `**The YouTube channel was updated!**\nChannel name: ${oldName} -> ${existingYoutubeChannel.name}\n`;
			} else{
				//if nothing was changed
				responseString = '**A YouTube channel already exists with this exact same information.** Did you mean to run this command?'
			}
			
			await interaction.followUp(responseString.replace(/^\s+|\s+$/g, ""));
		}
	},
};