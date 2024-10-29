const envFileName = `.env.${process.env.APP_ENV || "development"}`
require('dotenv').config({ path: envFileName });
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const reactionRoleHelper = require('../../helpers/reactionRoleHelper');


module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('reaction-role')
        .setDescription('Manage Reaction Roles')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
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
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('The name for this Reaction Role')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('emoji')
                        .setDescription('The emoji for this Reaction Role')
                )
        ) // close reaction role create
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edits a reaction role option')
                .addIntegerOption(option =>
                    option
                        .setName('role')
                        .setDescription('The Reaction Role to edit')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('The name for this Reaction Role')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('emoji')
                        .setDescription('The emoji for this Reaction Role')
                )
        ) // close reaction role edit
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Removes a reaction role option')
                .addIntegerOption(option =>
                    option
                        .setName('role')
                        .setDescription('The Reaction Role to remove')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ) // close reaction role delete
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.setContexts([0]),
    async autocomplete(interaction){
        // handle the autocompletion response
        var guild = interaction.guild;
        var RoleMenu = interaction.client.RoleMenu;
        var ReactionRole = interaction.client.ReactionRole;
        var focusedOption = interaction.options.getFocused(true);
        var focusedValue = focusedOption.value;
        var existingRoleMenus = await RoleMenu.findAll({where: {guild_id: guild.id}});
        if(focusedOption.name === "menu"){
            var filtered = existingRoleMenus.filter(roleMenu => roleMenu.title.startsWith(focusedValue));
            await interaction.respond(
                filtered.map(roleMenu => ({ name: roleMenu.title, value: roleMenu.id}))
            );
        } else if (focusedOption.name === "role"){
            var existingRoleMenuIds = existingRoleMenus.map(a => a.id);
            var existingReactionRoles = await ReactionRole.findAll({where: {role_menu_id: existingRoleMenuIds}});
            var filtered = existingReactionRoles.filter(reactionRole => reactionRole.name.startsWith(focusedValue));
            await interaction.respond(
                filtered.map(reactionRole => ({ name: reactionRole.name, value: reactionRole.id}))
            );
        }
    },
	async execute(interaction) {		
        // everything we do later might take a little bit, so defer the reply
		await interaction.deferReply();

        // notification livestream set
        if(interaction.options.getSubcommand() === 'create'){ 
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
        } else if (interaction.options.getSubcommand() === 'edit'){ 
            var ReactionRole = interaction.client.ReactionRole

            var role_id = interaction.options.getInteger('role');
            var emoji_id = interaction.options.getString('emoji');
            var name = interaction.options.getString('name');

            var role = await ReactionRole.findByPk(role_id);
            var roleMenu = await role.getRole_menu();
            var role_updated = await reactionRoleHelper.updateReactionRole(interaction.client, role_id, name, emoji_id);
            if(role_updated){
                try{
                    var rows = await roleMenu.buildActionRow();
                    var message_channel = await interaction.client.channels.cache.get(roleMenu.channel_id);
                    var message = await message_channel.messages.fetch(roleMenu.message_id);
                    await message.edit({components: rows})
                    
                    await interaction.followUp({content: `Reaction Role was updated`});
                } catch (error) {
                    console.log(error);
                    await interaction.followUp({content: `Reaction Role was updated, but the menu was not`});
                }  
            } else {
                await interaction.followUp({content: 'The Role Menu was unable to be updated'});
            }
        } else if (interaction.options.getSubcommand() === 'delete'){ 
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
        }
    },
};