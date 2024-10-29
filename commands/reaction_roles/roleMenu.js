const envFileName = `.env.${process.env.APP_ENV || "development"}`
require('dotenv').config({ path: envFileName });
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const roleMenuHelper = require('../../helpers/roleMenuHelper');
var randomColor = require('randomcolor');


module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('role-menu')
		.setDescription('Manage Role Menus on this server')
		.addSubcommand(subcommand =>
            subcommand
                .setName('create')
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
		) // close role-menu create
		.addSubcommand(subcommand =>
            subcommand
                .setName('delete')
				.setDescription('Removes a role menu message')
				.addIntegerOption(option =>
					option
						.setName('menu')
						.setDescription('The Role Menu to remove')
						.setRequired(true)
						.setAutocomplete(true)
				)
		) // close role-menu delete
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.setContexts([0]),
    async autocomplete(interaction){
        // handle the autocompletion response
        var guild = interaction.guild;
        var RoleMenu = interaction.client.RoleMenu
        var focusedValue = interaction.options.getFocused();
        var existingRoleMenus = await RoleMenu.findAll({where: {guild_id: guild.id}});
        var filtered = existingRoleMenus.filter(roleMenu => roleMenu.title.startsWith(focusedValue));

        await interaction.respond(
            filtered.map(roleMenu => ({ name: roleMenu.title, value: roleMenu.id}))
        );
    },
	async execute(interaction) {		
        // everything we do later might take a little bit, so defer the reply
		await interaction.deferReply();

        if(interaction.options.getSubcommand() === 'create'){
            var discord_channel = interaction.options.getChannel('channel');
            var discord_channel_id = discord_channel ? discord_channel.id : null;

            var type = interaction.options.getString('type');
            var guild = interaction.guild;
            var title = interaction.options.getString('title');

            var text = interaction.options.getString('text');
            text ||= interaction.client.RoleMenu.defaultText(type);

            var color = interaction.options.getString('embed_color');
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
        } else if (interaction.options.getSubcommand() === 'delete'){
            var RoleMenu = interaction.client.RoleMenu;

            var menu_id = interaction.options.getInteger('menu');
            var existingRoleMenu = await RoleMenu.findByPk(menu_id);
            var channel_id = existingRoleMenu.channel_id;
            var message_id = existingRoleMenu.message_id;

            var menu_deleted = await roleMenuHelper.deleteRoleMenu(interaction.client, menu_id);
            var message_deleted = false;

            if(menu_deleted){
                try{
                    var message_channel = await interaction.client.channels.cache.get(channel_id);
                    var message = await message_channel.messages.fetch(message_id);
                    message.delete();
                    message_deleted = true
                } catch (error) {
                    console.log("Unable to delete message!")
                    console.log(error);
                }
            }
            
            if(menu_deleted && message_deleted){
                await interaction.followUp({content: `Role Menu was deleted!`});
            } else if (menu_deleted){
                await interaction.followUp({content: `Role Menu was deleted from the database. Please manually delete the Role Menu message (automatic message deletion failed).`});
            } else {
                await interaction.followUp({content: 'Role Menu was unable to be deleted.'});
            }
        }
    },
};