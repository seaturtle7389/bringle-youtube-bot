const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const youtubeChannelHelper = require('../../helpers/youtubeChannelHelper')

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('removeuploadnotif')
		.setDescription('Removes upload notifications for a YouTube channel')
		.addStringOption(option =>
			option
				.setName('yt_channel')
				.setDescription('The YouTube account from which you want to remove upload notifications')
				.setRequired(true)
                .setAutocomplete(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.setContexts([0]),
        async autocomplete(interaction){
            // handle the autocompletion response
            var guild = interaction.guild;
            var YoutubeChannel = interaction.client.YoutubeChannel
            var focusedValue = interaction.options.getFocused();
            var existingYoutubeChannels = await YoutubeChannel.findAll({where: {guild_id: guild.id, upload_channel_id: {[client.Op.ne]: null}}});
            var filtered = existingYoutubeChannels.filter(youtubeChannel => youtubeChannel.name.startsWith(focusedValue));
    
            await interaction.respond(
                filtered.map(youtubeChannel => ({ name: youtubeChannel.name, value: youtubeChannel.youtube_id}))
            );
        },
	async execute(interaction) {		
		var YoutubeChannel = interaction.client.YoutubeChannel
		var guild = interaction.guild;

		var yt_channel_id = interaction.options.getString('yt_channel');
		var notif_channel = interaction.options.getChannel('notif_channel');
		var notif_channel_id = notif_channel ? notif_channel.id : null;
		var notif_role = interaction.options.getRole('notif_role');
        var notif_role_id = notif_role ? notif_role.id : null;
		var notif_text = interaction.options.getString('notif_text');
		
        // everything we do later might take a little bit, so defer the reply
        await interaction.deferReply();

		var  existingYoutubeChannel = await YoutubeChannel.findOne({where: {guild_id: guild.id, youtube_id: yt_channel_id}});
        existingYoutubeChannel = await existingYoutubeChannel.update({
            upload_channel_id: notif_channel_id,
            upload_role_id: notif_role_id, 
            upload_announcement: notif_text
        })
        responseString = `Upload notifications for ${existingYoutubeChannel.name} have been updated! New posts will be made in <#${existingYoutubeChannel.upload_channel_id}>\n\n**Notification message:**\n${await youtubeChannelHelper.getUploadNotificationString(interaction.client, existingYoutubeChannel.id, "SAMPLE VIDEO URL", "SAMPLE VIDEO TITLE")}`;
        await interaction.followUp(responseString.replace(/^\s+|\s+$/g, ""));
	},
};