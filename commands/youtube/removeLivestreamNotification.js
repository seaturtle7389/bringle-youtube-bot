const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const youtubeChannelHelper = require('../../helpers/youtubeChannelHelper')

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('remove-stream-notifs')
		.setDescription('Removes livestream notifications for a YouTube channel')
		.addIntegerOption(option =>
			option
				.setName('yt_channel')
				.setDescription('The YouTube account from which you want to remove livestream notifications')
				.setRequired(true)
                .setAutocomplete(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.setContexts([0]),
        async autocomplete(interaction){
            // handle the autocompletion response
            var guild = interaction.guild;
            var client = interaction.client;
            var YoutubeChannel = interaction.client.YoutubeChannel
            var focusedValue = interaction.options.getFocused();
            var existingYoutubeChannels = await YoutubeChannel.findAll({where: {guild_id: guild.id, livestream_channel_id: {[client.Op.ne]: null}}});
            var filtered = existingYoutubeChannels.filter(youtubeChannel => youtubeChannel.name.startsWith(focusedValue));
    
            await interaction.respond(
                filtered.map(youtubeChannel => ({ name: youtubeChannel.name, value: youtubeChannel.id}))
            );
        },
	async execute(interaction) {		
		var YoutubeChannel = interaction.client.YoutubeChannel

		var yt_channel_id = interaction.options.getInteger('yt_channel');
		
        // everything we do later might take a little bit, so defer the reply
        await interaction.deferReply();

		var  existingYoutubeChannel = await YoutubeChannel.findOne({where: {id: yt_channel_id}});
        existingYoutubeChannel = await existingYoutubeChannel.update({
            livestream_channel_id: null,
            livestream_role_id: null, 
            livestream_announcement: null,
            scheduled_livestream_announcement: null
        })
        responseString = `Livestream notifications for ${existingYoutubeChannel.name} have been disabled.`;
        await interaction.followUp(responseString.replace(/^\s+|\s+$/g, ""));
	},
};