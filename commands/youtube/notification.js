
const envFileName = `.env.${process.env.APP_ENV || "development"}`
require('dotenv').config({ path: envFileName });
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const sampleVideoUrl = process.env.SAMPLE_VIDEO_URL;
const sampleVideoTitle = process.env.SAMPLE_VIDEO_TITLE;

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('notif')
		.setDescription('Modify YouTube channel notifications')
        .addSubcommandGroup(subcommandGroup => 
            subcommandGroup
                .setName('stream')
                .setDescription('Modify YouTube livestream notifications')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('set')
                        .setDescription('Set a YouTube channel\'s livestream notification')
                        .addIntegerOption(option =>
                            option
                                .setName('yt_channel')
                                .setDescription('The YouTube channel you want to add livestream notifications for')
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                        .addChannelOption(option =>
                            option
                                .setName('notif_channel')
                                .setDescription('The Discord channel the bot will post in when this YouTube account creates a livestream')
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
                                .setDescription('Custom notification text')
                        )
                        .addStringOption(option =>
                            option
                                .setName('scheduled_notif_text')
                                .setDescription('Custom notification text for scheduled livestreams')
                        )
                ) // close notification livestream set subcommand

                .addSubcommand(subcommand =>
                    subcommand
                        .setName('disable')
                        .setDescription('Disable a YouTube channel\'s livestream notification')
                        .addIntegerOption(option =>
                            option
                                .setName('yt_channel')
                                .setDescription('The YouTube account from which you want to remove livestream notifications')
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                ) // close notification livestream disable subcommand
        ) // close notification livestream subcommand group
		.addSubcommandGroup(subcommandGroup => 
            subcommandGroup
                .setName('upload')
                .setDescription('Modify YouTube upload notifications')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('set')
                        .setDescription('Set a YouTube channel\'s upload notification')
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
                                .setDescription('Custom notification text')
                        )
                         .addRoleOption(option =>
                            option
                                .setName('short_notif_role')
                                .setDescription('The role the bot will ping when posting a notification for videos 3 minutes or shorter')
                        )
                        .addStringOption(option =>
                            option
                                .setName('short_notif_text')
                                .setDescription('Custom notification text for videos 3 minutes or shorter')
                        )
                ) // close notification upload set subcommand
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('disable')
                        .setDescription('Disable a YouTube channel\'s upload notification')
                        .addIntegerOption(option =>
                            option
                                .setName('yt_channel')
                                .setDescription('The YouTube account from which you want to remove upload notifications')
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                ) // close notification upload disable subcommand
        ) // close notification upload subcommand group
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.setContexts([0]),
        async autocomplete(interaction){
            // handle the autocompletion response
            // for this command and its subcommands, we are always just autocompleting yt_channel
            // this autocomplete may need to pull the subcommand details if further autocomplete functionality is implemented
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

        // the Youtube channel needs to be set up regardless of which command we're running
		var YoutubeChannel = interaction.client.YoutubeChannel
		var yt_channel_id = interaction.options.getInteger('yt_channel');
        var  existingYoutubeChannel = await YoutubeChannel.findByPk(yt_channel_id);

        // manage livestream subcommand responses
        if(interaction.options.getSubcommandGroup() === 'stream'){

            // notification livestream set
            if(interaction.options.getSubcommand() === 'set'){
                var notif_channel = interaction.options.getChannel('notif_channel');
                var notif_channel_id = notif_channel ? notif_channel.id : null;
                var notif_role = interaction.options.getRole('notif_role');
                var notif_role_id = notif_role ? notif_role.id : null;
                var notif_text = interaction.options.getString('notif_text');
                var scheduled_notif_text = interaction.options.getString('scheduled_notif_text');
                
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

            // notification livestream disable
            } else if(interaction.options.getSubcommand() === 'disable'){
                existingYoutubeChannel = await existingYoutubeChannel.update({
                    livestream_channel_id: null,
                    livestream_role_id: null, 
                    livestream_announcement: null,
                    scheduled_livestream_announcement: null
                })
                responseString = `Livestream notifications for ${existingYoutubeChannel.name} have been disabled.`;
                await interaction.followUp(responseString.replace(/^\s+|\s+$/g, ""));
            }

        // manage upload subcommand responses
        } else if (interaction.options.getSubcommandGroup() === 'upload'){

            // notification upload set
            if(interaction.options.getSubcommand() === 'set'){
                var yt_channel_id = interaction.options.getInteger('yt_channel');
                var notif_channel = interaction.options.getChannel('notif_channel');
                var notif_channel_id = notif_channel ? notif_channel.id : null;
                var notif_role = interaction.options.getRole('notif_role');
                var notif_role_id = notif_role ? notif_role.id : null;
                var short_notif_role = interaction.options.getRole('short_notif_role');
                var short_notif_role_id = short_notif_role ? short_notif_role.id : null;
                var notif_text = interaction.options.getString('notif_text');
                var short_notif_text = interaction.options.getString('short_notif_text');

                existingYoutubeChannel = await existingYoutubeChannel.update({
                    upload_channel_id: notif_channel_id,
                    upload_role_id: notif_role_id, 
                    short_upload_role_id: short_notif_role_id,
                    upload_announcement: notif_text,
                    short_upload_announcement: short_notif_text
                })

                // alert that changes were saved
                var responseString = `Upload notifications for ${existingYoutubeChannel.name} have been updated! New posts will be made in <#${existingYoutubeChannel.upload_channel_id}>`
                await interaction.followUp(responseString.replace(/^\s+|\s+$/g, ""));

                // show preview
                responseString = `**Notification preview:**\n${await existingYoutubeChannel.buildUploadNotification(sampleVideoUrl, sampleVideoTitle)}`;
                await interaction.followUp(responseString.replace(/^\s+|\s+$/g, ""));

            // notification upload disable
            } else if(interaction.options.getSubcommand() === 'disable'){
                existingYoutubeChannel = await existingYoutubeChannel.update({
                    upload_channel_id: null,
                    upload_role_id: null, 
                    upload_announcement: null
                })
                responseString = `Upload notifications for ${existingYoutubeChannel.name} have been disabled.`;
                await interaction.followUp(responseString.replace(/^\s+|\s+$/g, ""));
            }
        }
	}
};