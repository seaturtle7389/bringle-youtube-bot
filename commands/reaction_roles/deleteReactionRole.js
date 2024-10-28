const envFileName = `.env.${process.env.APP_ENV || "development"}`
require('dotenv').config({ path: envFileName });
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const reactionRoleHelper = require('../../helpers/reactionRoleHelper');


module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('delete-reaction-role')
		.setDescription('Removes a reaction role option')
		.addIntegerOption(option =>
			option
				.setName('role')
				.setDescription('The Reaction Role to remove')
                .setRequired(true)
                .setAutocomplete(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.setContexts([0]),
    async autocomplete(interaction){
        // handle the autocompletion response
        var guild = interaction.guild;
        var RoleMenu = interaction.client.RoleMenu
        var ReactionRole = interaction.client.ReactionRole
        var existingRoleMenus = await RoleMenu.findAll({where: {guild_id: guild.id}});
        var existingRoleMenuIds = existingRoleMenus.map(a => a.id);
        var focusedValue = interaction.options.getFocused();

        var existingReactionRoles = await ReactionRole.findAll({where: {role_menu_id: existingRoleMenuIds}});
        var filtered = existingReactionRoles.filter(reactionRole => reactionRole.name.startsWith(focusedValue));

        await interaction.respond(
            filtered.map(reactionRole => ({ name: reactionRole.name, value: reactionRole.id}))
        );
    },
	async execute(interaction) {		
        // everything we do later might take a little bit, so defer the reply
		await interaction.deferReply();
        var ReactionRole = interaction.client.ReactionRole
        var role_id = interaction.options.getInteger('role');
        var role = await ReactionRole.findByPk(role_id);
        var roleMenu = await role.getRole_menu();
		var role_deleted = await reactionRoleHelper.deleteReactionRole(interaction.client, role_id);

        if(role_deleted){
            try{
                var rows = await roleMenu.buildActionRow();
                var message_channel = await interaction.client.channels.cache.get(roleMenu.channel_id);
                var message = await message_channel.messages.fetch(roleMenu.message_id);

                if(rows){
                    await message.edit({components: rows})
                } else {
                    await message.edit({components: []})
                }
                
                await interaction.followUp({content: `Reaction Role was deleted`});
            } catch (error) {
                console.log(error);
                await interaction.followUp({content: `Reaction Role was deleted, but the menu was unable to be updated`});
            }  
        } else {
            await interaction.followUp({content: 'The Role Menu was unable to be deleted'});
        }
    },
};