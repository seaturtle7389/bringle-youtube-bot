const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const youtubeChannelHelper = require('../../helpers/youtubeChannelHelper')

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('remove-upload-notifs')
		.setDescription('Removes upload notifications for a YouTube channel')
		.addIntegerOption(option =>
			option
				.setName('yt_channel')
				.setDescription('The YouTube account from which you want to remove upload notifications')
				.setRequired(true)
                .setAutocomplete(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.setContexts([0]),
        async autocomplete(interaction){
            // handle the autocompletion response
            var guild = interaction.guild;
            var client = interaction.client;
            var YoutubeChannel = interaction.client.YoutubeChannel
            var focusedValue = interaction.options.getFocused();
            var existingYoutubeChannels = await YoutubeChannel.findAll({where: {guild_id: guild.id, upload_channel_id: {[client.Op.ne]: null}}});
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

		var  existingYoutubeChannel = await YoutubeChannel.findByPk(yt_channel_id);
        existingYoutubeChannel = await existingYoutubeChannel.update({
            upload_channel_id: null,
            upload_role_id: null, 
            upload_announcement: null
        })
        responseString = `Upload notifications for ${existingYoutubeChannel.name} have been disabled.`;
        await interaction.followUp(responseString.replace(/^\s+|\s+$/g, ""));
	},
};