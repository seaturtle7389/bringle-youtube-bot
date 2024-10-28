const envFileName = `.env.${process.env.APP_ENV || "development"}`
require('dotenv').config({ path: envFileName });
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const roleMenuHelper = require('../../helpers/roleMenuHelper');


module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('delete-role-menu')
		.setDescription('Removes a role menu message')
		.addIntegerOption(option =>
			option
				.setName('menu')
				.setDescription('The Role Menu to remove')
                .setRequired(true)
                .setAutocomplete(true)
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
		var menu_deleted = await roleMenuHelper.deleteRoleMenu(interaction.client, menu_id);

        if(menu_deleted){
            await interaction.followUp({content: `Role Menu was deleted from the database. Please manually delete the Role Menu Message.`});
        } else {
            await interaction.followUp({content: 'The Role Menu was unable to be deleted from the database'});
        }
    },
};