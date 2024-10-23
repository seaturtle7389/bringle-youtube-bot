const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const youtubeChannelHelper = require('../../helpers/youtubeChannelHelper')


module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('delete-youtube-channel')
		.setDescription('Removes a YouTube channel that was added for notifications')
        // this displays to the user as a string, but because we use autocomplete we're really mapping the integers to the names
        .addIntegerOption(option =>
			option
				.setName('yt_channel')
				.setDescription('The YouTube channel that you no longer want to receive notifications for')
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
        var existingYoutubeChannels = await YoutubeChannel.findAll({where: {guild_id: guild.id}});
        var filtered = existingYoutubeChannels.filter(youtubeChannel => youtubeChannel.name.startsWith(focusedValue));

        await interaction.respond(
            filtered.map(youtubeChannel => ({ name: youtubeChannel.name, value: youtubeChannel.id}))
        );
    },
	async execute(interaction) {
        await interaction.deferReply();
        var yt_channel_id = interaction.options.getInteger('yt_channel');
        var result = await youtubeChannelHelper.deleteYoutubeChannel(interaction.client, yt_channel_id)
        if (result) {
            await interaction.followUp({content: `**Successfully deleted YouTube channel "${result}.**"`});
        } else {
            await interaction.followUp({content: `**Unable to delete YouTube channel.**`});
        }

	},
};