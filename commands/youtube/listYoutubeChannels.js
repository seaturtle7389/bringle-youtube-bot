const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder, ActionRow, ComponentType } = require('discord.js');
const YoutubeChannel = require('../../models/YoutubeChannel');
const youtubeChannelHelper = require('../../helpers/youtubeChannelHelper')
const util = require('util')
var randomColor = require('randomcolor');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('listyoutubechannels')
		.setDescription('Displays all YouTube channels currently set up on the server')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.setContexts([0]),
	async execute(interaction) {
        await interaction.deferReply();
        var guild = interaction.guild;
		var YoutubeChannel = interaction.client.YoutubeChannel

        var youtubeChannels = await YoutubeChannel.findAll({where: {guild_id: guild.id}});
        var youtubeChannelIds = youtubeChannels.map(youtubeChannel => youtubeChannel.youtube_channel_id)
        var response = await youtubeChannelHelper.fetchYoutubeChannelsDetails(youtubeChannelIds);
        if (response && response.items){
            const channelDetails = response.items;
            console.log(channelDetails);
            var index = 0;
            var color = randomColor();
            var channel = await youtubeChannels.find((youtubeChannel) => youtubeChannel.youtube_channel_id == channelDetails[index].id)
            var channelDetailsEmbed = new EmbedBuilder()
                .setTitle(`${channelDetails[index].snippet.title} (${channelDetails[index].snippet.customUrl})`)
                .setURL(`https://youtube.com/${channelDetails[index].snippet.customUrl}`)
                .setDescription(channelDetails[index].snippet.description)
                .setThumbnail(channelDetails[index].snippet.thumbnails.default.url)
                .setColor(color)
                .addFields(
                    {name: 'Subscribers', value: `${channelDetails[index].statistics.subscriberCount}`, inline: true},
                    {name: 'Uploads', value: `[Click Here](https://youtube.com/playlist?list=${channelDetails[index].contentDetails.relatedPlaylists.uploads})`, inline: true},
                    {name: 'Nickname', value: channel.name},
                    {name: 'YouTube channel ID', value: `\`${channel.youtube_channel_id}\``, inline: true},
                    {name: 'Upload notification channel', value: channel.upload_channel_id ? `<#${channel.upload_channel_id}>` : "N/A"},
                    {name: 'Livestream notification channel', value: channel.livestream_channel_id ? `<#${channel.livestream_channel_id}>` : "N/A"},
                )
                .setFooter({text: `Viewing channel ${index + 1} of ${channelDetails.length}`})
                .setTimestamp()

            // if there's only one channel, you shouldn't be able to press the forward button
            var forwardButtonDisabled = (channelDetails.length == 1)
            var forwardButton = new ButtonBuilder()
                .setCustomId('forward')
                .setLabel('Next')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(forwardButtonDisabled)

            // backwards button should always be disabled to start
            var backwardButtonDisabled = true;
            var backwardButton = new ButtonBuilder()
                .setCustomId('backward')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(backwardButtonDisabled)

            var cancelButton = new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger)

            var row = new ActionRowBuilder()
                .addComponents(backwardButton, forwardButton, cancelButton)

            var embedResponse = await interaction.followUp({embeds: [channelDetailsEmbed], components: [row]});
            var collectorFilter = i => i.user.id === interaction.user.id;
            var collector = embedResponse.createMessageComponentCollector({ filter: collectorFilter, componentType: ComponentType.Button, idle: 60_000});

            collector.on('collect', async buttonInteraction => {
                var value = buttonInteraction.customId;
                await buttonInteraction.deferUpdate();

                // if the user pressed the cancel button, stop the collector from checking more button presses
                if(value == 'cancel'){
                    collector.stop('cancelled')
                    return;
                }
                
                if(value == 'forward'){
                    index++;
                } else if (value == 'backward'){
                    index--;
                }
                console.log(index);
                console.log(channelDetails);
                //failsafes in case somehow people press buttons they shouldn't be able to....
                if(index < 0) {
                    index = 0;
                } else if (index > channelDetails.length - 1) {
                    index = channelDetails.length - 1
                }

                var updatedChannel = await youtubeChannels.find((youtubeChannel) => youtubeChannel.youtube_channel_id == channelDetails[index].id)
                var updatedChannelDetailsEmbed = new EmbedBuilder()
                    .setTitle(`${channelDetails[index].snippet.title} (${channelDetails[index].snippet.customUrl})`)
                    .setURL(`https://youtube.com/${channelDetails[index].snippet.customUrl}`)
                    .setDescription(channelDetails[index].snippet.description)
                    .setThumbnail(channelDetails[index].snippet.thumbnails.default.url)
                    .setColor(color)
                    .addFields(
                        {name: 'Subscribers', value: `${channelDetails[index].statistics.subscriberCount}`, inline: true},
                        {name: 'Uploads', value: `[Click Here](https://youtube.com/playlist?list=${channelDetails[index].contentDetails.relatedPlaylists.uploads})`, inline: true},
                        {name: 'Nickname', value: updatedChannel.name},
                        {name: 'YouTube channel ID', value: `\`${updatedChannel.youtube_channel_id}\``, inline: true},
                        {name: 'Upload notification channel', value: updatedChannel.upload_channel_id ? `<#${updatedChannel.upload_channel_id}>` : 'N/A'},
                        {name: 'Livestream notification channel', value: updatedChannel.livestream_channel_id ? `<#${updatedChannel.livestream_channel_id}>` : 'N/A'},
                    )
                    .setFooter({text: `Viewing channel ${index + 1} of ${channelDetails.length}`})
                    .setTimestamp()

                // adjust the buttons disable state if necessary
                backwardButtonDisabled = (index == 0);
                forwardButtonDisabled = (index == channelDetails.length - 1)
                var updatedForwardButton = ButtonBuilder.from(forwardButton).setDisabled(forwardButtonDisabled);  
                var updatedbackwardButton = ButtonBuilder.from(backwardButton).setDisabled(backwardButtonDisabled);
                var updatedRow =  ActionRowBuilder.from(row).setComponents(updatedbackwardButton, updatedForwardButton, cancelButton);
                
                message = buttonInteraction.message
                await message.edit({embeds: [updatedChannelDetailsEmbed], components: [updatedRow]})
            });
            collector.on('end', async (collected, reason) => {
                // grab the current state of reply message
                var reply = await interaction.fetchReply();

                // update embed color to default
                var updatedEmbed = EmbedBuilder.from(reply.embeds[0]).setColor(null);
                
                // disable all buttons
                var updatedForwardButton = ButtonBuilder.from(forwardButton).setDisabled(true);
                var updatedbackwardButton = ButtonBuilder.from(backwardButton).setDisabled(true);
                var updatedCancelButton = ButtonBuilder.from(cancelButton).setDisabled(true);
                var updatedRow =  ActionRowBuilder.from(row).setComponents(updatedbackwardButton, updatedForwardButton, updatedCancelButton);

                await embedResponse.edit({
                    embeds: [updatedEmbed],
                    components: [updatedRow]
                })

                // if the message timed out, send an ephemeral message
                if (reason == 'idle') {
                    await interaction.followUp({content: "Command timed out, to change pages re-send the command.", ephemeral: true})
                }
            });
        } else {
            await interaction.followUp({content: 'There was an error grabbing YouTube channel details.'});

        }
	},
};