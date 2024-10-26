const envFileName = `.env.${process.env.APP_ENV || "development"}`
require('dotenv').config({ path: envFileName });
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const youtubeChannelHelper = require('../../helpers/youtubeChannelHelper')
const sampleVideoUrl = process.env.SAMPLE_VIDEO_URL;
const sampleVideoTitle = process.env.SAMPLE_VIDEO_TITLE;

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('set-upload-notifs')
		.setDescription('Sets up upload notifications for a YouTube channel')
		.addIntegerOption(option =>
			option
				.setName('yt_channel')
				.setDescription('The YouTube account you want to add upload notifications for')
				.setRequired(true)
                .setAutocomplete(true)
		)
		.addChannelOption(option =>
			option
				.setName('notif_channel')
				.setDescription('The Discord channel the bot will post in when this YouTube account posts a new video')
                .setRequired(true)
				.addChannelTypes(ChannelType.GuildText)
		)
        .addRoleOption(option =>
			option
				.setName('notif_role')
				.setDescription('The role the bot will ping when posting a notification')
		)
        .addStringOption(option =>
			option
				.setName('notif_text')
				.setDescription('Custom notification text (optional)')
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.setContexts([0]),
        async autocomplete(interaction){
            // handle the autocompletion response
            var guild = interaction.guild;
            var YoutubeChannel = interaction.client.YoutubeChannel
            var focusedValue = interaction.options.getFocused();
            var existingYoutubeChannels = await YoutubeChannel.findAll({where: {guild_id: guild.id}});
            var filtered = existingYoutubeChannels.filter(youtubeChannel => youtubeChannel.name.startsWith(focusedValue));
    
            await interaction.respond(
                filtered.map(youtubeChannel => ({ name: youtubeChannel.name, value: youtubeChannel.id}))
            );
        },
	async execute(interaction) {		
		var YoutubeChannel = interaction.client.YoutubeChannel

		var yt_channel_id = interaction.options.getInteger('yt_channel');
		var notif_channel = interaction.options.getChannel('notif_channel');
		var notif_channel_id = notif_channel ? notif_channel.id : null;
		var notif_role = interaction.options.getRole('notif_role');
        var notif_role_id = notif_role ? notif_role.id : null;
		var notif_text = interaction.options.getString('notif_text');
		
        // everything we do later might take a little bit, so defer the reply
        await interaction.deferReply();

		var  existingYoutubeChannel = await YoutubeChannel.findByPk(yt_channel_id);
        existingYoutubeChannel = await existingYoutubeChannel.update({
            upload_channel_id: notif_channel_id,
            upload_role_id: notif_role_id, 
            upload_announcement: notif_text
        })

		// alert that changes were saved
        var responseString = `Upload notifications for ${existingYoutubeChannel.name} have been updated! New posts will be made in <#${existingYoutubeChannel.upload_channel_id}>`
		await interaction.followUp(responseString.replace(/^\s+|\s+$/g, ""));

		// show preview
		responseString = `**Notification preview:**\n${await existingYoutubeChannel.buildUploadNotification(sampleVideoUrl, sampleVideoTitle)}`;
        await interaction.followUp(responseString.replace(/^\s+|\s+$/g, ""));
	},
};