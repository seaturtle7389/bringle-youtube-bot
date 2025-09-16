const envFileName = `.env.${process.env.APP_ENV || "development"}`
require('dotenv').config({ path: envFileName });
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder, ComponentType } = require('discord.js');
const youtubeChannelHelper = require('../../helpers/youtubeChannelHelper');
const youtubeFetchTimeout = process.env.YOUTUBE_FETCH_INTERVAL / 60 / 1000;
var randomColor = require('randomcolor');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('yt-channel')
		.setDescription('Modify YouTube channels')
		.addSubcommand(subcommand =>
			subcommand
				.setName('create')
				.setDescription('Configure a new YouTube channel for notifications on this server')
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
		) // close youtube-channel create subcommand
		.addSubcommand(subcommand =>
			subcommand
				.setName('delete')
				.setDescription('Remove a new YouTube channel\'s configuration from this server')
				.addIntegerOption(option =>
					option
						.setName('yt_channel')
						.setDescription('The YouTube channel that you no longer want to receive notifications for')
						.setRequired(true)
						.setAutocomplete(true)
				)
		) // close youtube-channel delete subcommand
		.addSubcommand(subcommand =>
			subcommand
				.setName('edit')
				.setDescription('Edit a new YouTube channel\'s configuration for this server')
				.addIntegerOption(option =>
					option
						.setName('yt_channel')
						.setDescription('The YouTube channel that you wish to edit the configuration for')
						.setRequired(true)
						.setAutocomplete(true)
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
		) // close youtube-channel edit subcommand
		.addSubcommand(subcommand =>
			subcommand
				.setName('list')
				.setDescription('Displays all YouTube channels currently set up on this server')
		) // close youtube-channel list subcommand

		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.setContexts([0]),
	async autocomplete(interaction){
		// handle the autocompletion response
		// this is only used for the edit and delete subcommands, and each of them will only ever return YouTube channels
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
		// everything we do later might take a little bit, so defer the reply
		await interaction.deferReply();
		var YoutubeChannel = interaction.client.YoutubeChannel
		var guild = interaction.guild;

		// manage create subcommand response
		if(interaction.options.getSubcommand() === 'create'){
			var yt_handle = interaction.options.getString('yt_handle');
			var nickname = interaction.options.getString('nickname');
			var video_check_interval = interaction.options.getInteger('video_check_interval');

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
				await interaction.followUp('**A YouTube channel already exists with this exact same information.** Did you mean to run this command?');
			}

		// manage delete subcommand response
		} else if(interaction.options.getSubcommand() === 'delete'){

			var yt_channel_id = interaction.options.getInteger('yt_channel');
			var result = await youtubeChannelHelper.deleteYoutubeChannel(interaction.client, yt_channel_id)
			if (result) {
				await interaction.followUp({content: `**Successfully deleted YouTube channel "${result}"**`});
			} else {
				await interaction.followUp({content: `**Unable to delete YouTube channel.**`});
			}

		// manage edit subcommand response
		} else if(interaction.options.getSubcommand() === 'edit'){
			var yt_channel_id = interaction.options.getInteger('yt_channel');
			var  existingYoutubeChannel = await YoutubeChannel.findByPk(yt_channel_id);
			var nickname = interaction.options.getString('nickname');
			var video_check_interval = interaction.options.getInteger('video_check_interval');

			if(existingYoutubeChannel){
				try{
					result = existingYoutubeChannel = await existingYoutubeChannel.update({
						name: nickname,
						video_check_interval: video_check_interval
					})
					await interaction.followUp({content: `**Successfully updated YouTube channel "${result.name}"**`});
				} catch (error) {
					console.log(error);
					await interaction.followUp({content: `**Unable to update YouTube channel.**`});
				}
			} else {
				await interaction.followUp({content: `**YouTube channel does not exist.**`});
			}
			
		// manage list subcommand response
		} else if(interaction.options.getSubcommand() === 'list'){
			var guild = interaction.guild;
			var YoutubeChannel = interaction.client.YoutubeChannel

			var youtubeChannels = await YoutubeChannel.findAll({where: {guild_id: guild.id}});
			var youtubeChannelIds = youtubeChannels.map(youtubeChannel => youtubeChannel.youtube_id)
			var response = await youtubeChannelHelper.fetchYoutubeChannelsDetails(youtubeChannelIds);
			if (response && response.items){
				const channelDetails = response.items;
				console.log("HERE");
				console.log(channelDetails);
				var index = 0;
				var color = randomColor();
				var channel = await youtubeChannels.find((youtubeChannel) => youtubeChannel.youtube_id == channelDetails[index].id)
				var channelDetailsEmbed = new EmbedBuilder()
					.setTitle(`${channelDetails[index].snippet.title} (${channel.youtube_handle})`)
					.setURL(channel.getUrl())
					.setDescription(channelDetails[index].snippet.description)
					.setThumbnail(channelDetails[index].snippet.thumbnails.default.url)
					.setColor(color)
					.addFields(
						{name: 'Subscribers', value: `${channelDetails[index].statistics.subscriberCount}`, inline: true},
						{name: 'Uploads', value: `[Click Here](https://youtube.com/playlist?list=${channelDetails[index].contentDetails.relatedPlaylists.uploads})`, inline: true},
						{name: 'Nickname', value: channel.name},
						{name: 'Video check interval', value: (channel.video_check_interval != null && channel.video_check_interval > 0) ? `${channel.video_check_interval} minute(s)` : `${youtubeFetchTimeout} minute(s) [bot default]`},
						{name: 'YouTube channel ID', value: `\`${channel.youtube_id}\``, inline: true},
						{name: 'Upload notifications', value: channel.upload_channel_id ? `channel: <#${channel.upload_channel_id}> ${channel.upload_role_id ? `\nrole ping: <@&${channel.upload_role_id}>` : ""}` : "N/A"},
						{name: 'Shorts upload notifications', value: channel.upload_channel_id ? `channel: <#${channel.upload_channel_id}> ${channel.short_upload_role_id ? `\nrole ping: <@&${channel.short_upload_role_id}>` : ""}` : "N/A"},
						{name: 'Livestream notifications', value: channel.livestream_channel_id ? `channel: <#${channel.livestream_channel_id}> ${channel.livestream_role_id ? `\nrole ping: <@&${channel.livestream_role_id}>` : ""}` : "N/A"},
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
					//failsafes in case somehow people press buttons  they shouldn't be able to....
					if(index < 0) {
						index = 0;
					} else if (index > channelDetails.length - 1) {
						index = channelDetails.length - 1
					}

					var updatedChannel = await youtubeChannels.find((youtubeChannel) => youtubeChannel.youtube_id == channelDetails[index].id)
					var updatedChannelDetailsEmbed = new EmbedBuilder()
						.setTitle(`${channelDetails[index].snippet.title} (${updatedChannel.youtube_handle})`)
						.setURL(updatedChannel.getUrl())
						.setDescription(channelDetails[index].snippet.description)
						.setThumbnail(channelDetails[index].snippet.thumbnails.default.url)
						.setColor(color)
						.addFields(
							{name: 'Subscribers', value: `${channelDetails[index].statistics.subscriberCount}`, inline: true},
							{name: 'Uploads', value: `[Click Here](https://youtube.com/playlist?list=${channelDetails[index].contentDetails.relatedPlaylists.uploads})`, inline: true},
							{name: 'Nickname', value: updatedChannel.name},
							{name: 'Video check interval', value: (updatedChannel.video_check_interval != null && updatedChannel.video_check_interval > 0) ? `${updatedChannel.video_check_interval} minute(s)` : `${youtubeFetchTimeout} minute(s) [bot default]`},
							{name: 'YouTube channel ID', value: `\`${updatedChannel.youtube_id}\``, inline: true},
							{name: 'Upload notification channel', value: updatedChannel.upload_channel_id ? `channel: <#${updatedChannel.upload_channel_id}> ${updatedChannel.upload_role_id ? `\nrole ping: <@&${updatedChannel.upload_role_id}>` : ""}` : "N/A"},
							{name: 'Shorts upload notification channel', value: updatedChannel.upload_channel_id ? `channel: <#${updatedChannel.upload_channel_id}> ${updatedChannel.short_upload_role_id ? `\nrole ping: <@&${updatedChannel.short_upload_role_id}>` : ""}` : "N/A"},
							{name: 'Livestream notification channel', value: updatedChannel.livestream_channel_id ? `channel: <#${updatedChannel.livestream_channel_id}> ${updatedChannel.livestream_role_id ? `\nrole ping: <@&${updatedChannel.livestream_role_id}>` : ""}` : "N/A"},
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
		}
	},
};