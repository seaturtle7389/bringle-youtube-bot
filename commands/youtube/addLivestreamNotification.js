require('dotenv').config();
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const sampleVideoUrl = process.env.SAMPLE_VIDEO_URL;
const sampleVideoTitle = process.env.SAMPLE_VIDEO_TITLE;

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('set-stream-notifs')
		.setDescription('Sets up livestream notifications for a YouTube channel')
		.addIntegerOption(option =>
			option
				.setName('yt_channel')
				.setDescription('The YouTube account you want to add livestream notifications for')
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
        .addStringOption(option =>
			option
				.setName('scheduled_notif_text')
				.setDescription('Custom notification text for scheduled livestreams (optional)')
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
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
        var scheduled_notif_text = interaction.options.getString('scheduled_notif_text');
		
        // everything we do later might take a little bit, so defer the reply
        await interaction.deferReply();

		var  existingYoutubeChannel = await YoutubeChannel.findByPk(yt_channel_id);
        existingYoutubeChannel = await existingYoutubeChannel.update({
            livestream_channel_id: notif_channel_id,
            livestream_role_id: notif_role_id, 
            livestream_announcement: notif_text,
            scheduled_livestream_announcement: scheduled_notif_text
        })

		// alert that changes were saved
        var responseString = `Stream notifications for ${existingYoutubeChannel.name} have been updated! New posts will be made in <#${existingYoutubeChannel.livestream_channel_id}>`
		await interaction.followUp(responseString.replace(/^\s+|\s+$/g, ""));

		// show preview
		responseString = `**Notification preview:**\n${await existingYoutubeChannel.buildStreamNotification(sampleVideoUrl, sampleVideoTitle)}`
		await interaction.followUp(responseString.replace(/^\s+|\s+$/g, ""));

		// show scheduled preview
		var randomMinutes = Math.floor(Math.random() * 60);
		var randomMilliseconds = randomMinutes * 60 * 1000;
		var sampleUnixTime = Math.floor((Date.now() + randomMilliseconds) / 1000);
		responseString = `**Scheduled notification preview:**\n${await existingYoutubeChannel.buildScheduledStreamNotification(sampleVideoUrl, sampleVideoTitle, sampleUnixTime)}`;
        await interaction.followUp(responseString.replace(/^\s+|\s+$/g, ""));
	}
};