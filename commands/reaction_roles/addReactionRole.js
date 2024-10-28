const envFileName = `.env.${process.env.APP_ENV || "development"}`
require('dotenv').config({ path: envFileName });
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const reactionRoleHelper = require('../../helpers/reactionRoleHelper');


module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('add-reaction-role')
		.setDescription('Adds a Reaction Role to the specified channel')
		.addIntegerOption(option =>
			option
				.setName('menu')
				.setDescription('The Role Menu to add the Reaction Role to')
                .setRequired(true)
                .setAutocomplete(true)
		)
        .addRoleOption(option =>
			option
				.setName('role')
				.setDescription('The role to add to the Role Menu')
		)
		.addStringOption(option =>
			option
				.setName('name')
				.setDescription('The name for this Reaction Role')
		)
        .addStringOption(option =>
			option
				.setName('emoji')
				.setDescription('The emoji for this Reaction Role')
		)
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

        var menu_id = interaction.options.getInteger('menu');
        var role = interaction.options.getRole('role');
        var role_id = role ? role.id : null;
        var emoji_id = interaction.options.getString('emoji');
		var name = interaction.options.getString('name');

		var role = await reactionRoleHelper.createReactionRole(interaction.client, menu_id, role_id, emoji_id, name);
            if(role){
                try{
                    var roleMenu = await role.getRole_menu();
                    var rows = await roleMenu.buildActionRow();

                    var message_channel = await interaction.client.channels.cache.get(roleMenu.channel_id);
                    var message = await message_channel.messages.fetch(roleMenu.message_id);

                    if(rows){
                        await message.edit({components: rows})
                    } else {
                        await message.edit({components: []})
                    }
                    await interaction.followUp({content: `Reaction Role was created`});
                } catch (error) {
                    await reactionRoleHelper.deleteReactionRole(interaction.client, role.id);
                    await interaction.followUp({content: 'There was an error creating the Reaction Role'});
                    console.log(error);
                }
            } else {
                await interaction.followUp({content: 'A Reaction Role for this role already exists!'});
            }
    },
};