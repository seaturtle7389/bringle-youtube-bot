const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const YoutubeChannel = require('../../models/YoutubeChannel');
const youtubeChannelHelper = require('../../helpers/youtubeChannelHelper')

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
				.addChannelTypes(ChannelType.GuildText)
		)
		.addChannelOption(option =>
			option
				.setName('upload_notif_channel')
				.setDescription('The Discord channel the bot will post in when this YouTube account posts a new video')
				.addChannelTypes(ChannelType.GuildText)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.setContexts([0]),
	async execute(interaction) {
		const yt_channel_id = interaction.options.getString('yt_channel_id');
		const nickname = interaction.options.getString('nickname');
		const live_notif_channel = interaction.options.getChannel('live_notif_channel');
		const live_notif_channel_id = live_notif_channel ? live_notif_channel.id : null;
		const upload_notif_channel = interaction.options.getChannel('upload_notif_channel');
		const upload_notif_channel_id = upload_notif_channel ? upload_notif_channel.id : null;
		const guild = interaction.guild;
		const YoutubeChannel = interaction.client.YoutubeChannel
		
		// you must supply at least one channel or there's no point in adding it lol
		if(live_notif_channel || upload_notif_channel){
			// everything we do later might take a little bit, so defer the reply
			await interaction.deferReply();

			// make sure the channel exists before we add it to the database
			channel_exists = await youtubeChannelHelper.validateYoutubeChannelId(yt_channel_id);
			if(!channel_exists){
				await interaction.followUp(`**YouTube channel with the ID ${yt_channel_id} does not exist.**`);
				return;
			}

			var  existingYoutubeChannel = await YoutubeChannel.findOne({where: {guild_id: guild.id, youtube_channel_id: yt_channel_id}});
    		if (!existingYoutubeChannel) {
				const newYoutubeChannel = youtubeChannelHelper.createYoutubeChannel(interaction.client, nickname, guild.id, yt_channel_id, upload_notif_channel_id, live_notif_channel_id)
				if (newYoutubeChannel){
					await interaction.followUp(`**YouTube channel "${newYoutubeChannel.name}" was added!**`);
				} else {
					await interaction.followUp(`**YouTube channel "${nickname}" was not added due to an unexpected error.**`);
				}
			} else {
				oldName = existingYoutubeChannel.name;
				oldUploadChannelId = existingYoutubeChannel.upload_channel_id;
				oldNotificationChannelId = existingYoutubeChannel.notification_channel_id;
				existingYoutubeChannel = await existingYoutubeChannel.update({
					name: nickname,
					upload_channel_id: upload_notif_channel_id,
					notification_channel_id: live_notif_channel_id
				})
				responseString = '**The YouTube channel was updated!**\n'
				var changed = false;
				if(oldName != existingYoutubeChannel.name){
					responseString += `Channel name: ${oldName} -> ${existingYoutubeChannel.name}\n`;
					changed = true;
				}
				if(oldUploadChannelId != existingYoutubeChannel.upload_channel_id){
					responseString += `Upload channel ID: ${oldUploadChannelId} -> ${existingYoutubeChannel.upload_channel_id}\n`;
					changed = true;
				}
				if(oldNotificationChannelId != existingYoutubeChannel.notification_channel_id){
					responseString += `Livestream channel ID: ${oldNotificationChannelId} -> ${existingYoutubeChannel.notification_channel_id}`;
					changed = true;
				}
				// overwrite the message if nothing was changed
				if (!changed){
					responseString = '**A YouTube channel already exists with this exact same information.** Did you mean to run this command?'
				}
				await interaction.followUp(responseString.replace(/^\s+|\s+$/g, ""));
			}
		} else {
			await interaction.reply(`**YouTube channel "${nickname}" was not added.** Either a live notification channel or an upload notification channel is required.`);
		}
	},
};