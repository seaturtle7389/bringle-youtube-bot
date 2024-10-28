const envFileName = `.env.${process.env.APP_ENV || "development"}`
require('dotenv').config({ path: envFileName });
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const roleMenuHelper = require('../../helpers/roleMenuHelper');
var randomColor = require('randomcolor');


module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('add-role-menu')
		.setDescription('Adds a Role Menu to the specified channel')
		.addChannelOption(option =>
			option
				.setName('channel')
				.setDescription('The Discord channel the bot will post this Role Menu in')
                .setRequired(true)
				.addChannelTypes(ChannelType.GuildText)
		)
        .addStringOption(option =>
			option.setName('type')
				.setDescription('The type of Role Menu to create')
				.setRequired(true)
				.addChoices(
					{ name: 'Dropdown', value: 'DROPDOWN' },
					{ name: 'Button', value: 'BUTTON' },
				)
        )
		.addStringOption(option =>
			option
				.setName('title')
				.setDescription('The title of this Role Menu')
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName('text')
				.setDescription('The text for this Role Menu (automatically generated if left empty)')
		)
        .addStringOption(option =>
			option
				.setName('embed_color')
				.setDescription('The embed color for this Role Menu in hex format #AABBCC')
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.setContexts([0]),
	async execute(interaction) {		
        // everything we do later might take a little bit, so defer the reply
		await interaction.deferReply();

		var discord_channel = interaction.options.getChannel('channel');
        var discord_channel_id = discord_channel ? discord_channel.id : null;

        var type = interaction.options.getString('type');
        var guild = interaction.guild;
        var title = interaction.options.getString('title');

		var text = interaction.options.getString('text');
        text ||= interaction.client.RoleMenu.defaultText(type);

        var color = interaction.options.getString('embed_color');
        console.log(color);
        console.log(/^#([0-9A-F]{3}){1,2}$/i.test(color));
        if(color == null || !(/^#([0-9A-F]{3}){1,2}$/i.test(color))){
            color = randomColor();
        } else {
            var r = parseInt(color.slice(1, 3), 16);
            var g = parseInt(color.slice(3, 5), 16);
            var b = parseInt(color.slice(5, 7), 16);
            color =  (r | g << 8 | b << 16);
        }

        var roleMenuEmbed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(text)
            .setColor(color)
            .setTimestamp()
        
        var message = await discord_channel.send({ embeds: [roleMenuEmbed] });
        if(message && message.id){
            var menu = await roleMenuHelper.createRoleMenu(interaction.client, type, guild.id, discord_channel_id, message.id, title, text);
            if(menu){
                await interaction.followUp({content: `Role menu was created and posted in <#${message.channelId}>`});
            } else {
                await interaction.followUp({content: 'There was an error creating the Role Menu'});
            }
        } else {
            await interaction.followUp({content: 'There was an error creating the Role Menu'});
        }
    },
};