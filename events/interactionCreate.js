const { Events, Collection } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()){
			var command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			var { cooldowns } = interaction.client;

			if (!cooldowns.has(command.data.name)) {
				cooldowns.set(command.data.name, new Collection());
			}
			
			var now = Date.now();
			var timestamps = cooldowns.get(command.data.name);
			var defaultCooldownDuration = 3;
			var cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;
			
			if (timestamps.has(interaction.user.id)) {
				var expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
				var time_remaining = expirationTime - now;
				if (time_remaining > 0) {
					var expiredTimestamp = Math.round(expirationTime / 1_000);
					await interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, ephemeral: true });
					setTimeout(async function(){
						await interaction.deleteReply();
					}, time_remaining);
					return;
				}
			}
			
			timestamps.set(interaction.user.id, now);
			setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(error);
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
				} else {
					await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
				}
			}
		} else if (interaction.isAutocomplete()){
			var command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.autocomplete(interaction);
			} catch (error) {
				console.error(error);
			}
		} else if (interaction.isButton()) {
			await interaction.deferReply({ephemeral: true});

			var buttonId = interaction.customId;
			var ReactionRole = interaction.client.ReactionRole;
			var role = await ReactionRole.findByPk(parseInt(buttonId));
			if(role){
				var member = interaction.member;
				try{
					if(member.roles.cache.has(role.role_id)){
						var success = await member.roles.remove(role.role_id); 
						if(success) {
							return interaction.followUp({
								content: `Successfully removed <@&${role.role_id}>!`
							});
						} else {
							return interaction.followUp({
								content: 'Unable to remove role.'
							});
						}
					} else {
						var success = await member.roles.add(role.role_id);
						if(success) {
							return interaction.followUp({
								content: `Successfully added <@&${role.role_id}>!`
							})
						} else {
							return interaction.followUp({
								content: 'Unable to add role.'
							})
						}
				 	} 
				} catch (error){
					console.log(error);
					return interaction.followUp({
						content: `**There was an error while handling the interaction**\n\`\`\`code: ${error.code}\nmessage: ${error.message}\`\`\``
					})
				}
			}

		} else if (interaction.isStringSelectMenu()) {
			await interaction.deferReply({ephemeral: true});

			var selectId = interaction.customId;
			var RoleMenu = interaction.client.RoleMenu;
			var menu = await RoleMenu.findByPk(parseInt(selectId));
			if(menu && interaction.values[0] != null){
				var member = interaction.member;
				var ReactionRole = interaction.client.ReactionRole;
				var selectedRole = await ReactionRole.findByPk(parseInt(interaction.values[0]));
				var menuRoles = await menu.getReaction_roles();
				if(selectedRole && menuRoles){
					try{
						var roleAdded = false;
						var roleRemoved = false;
						for(role of menuRoles){
							if(role.id == selectedRole.id){
								if(!member.roles.cache.has(role.role_id)){
									await member.roles.add(role.role_id); 
									roleAdded = true;
								}
							} else {
								if(member.roles.cache.has(role.role_id)){
									await member.roles.remove(role.role_id); 
									roleRemoved = true;
								}
							}
						}
						var message = ""
						if(roleAdded){
							message += `Successfully added <@&${selectedRole.role_id}>!`
						} else {
							message += `Unable to add <@&${selectedRole.role_id}> - do you already have it?`

						}

						if(roleRemoved){
							message += ` Other selectable roles were removed.`
						}

						return interaction.followUp({
							content: message
						})
					} catch (error) {
						console.log(error);
						return interaction.followUp({
							content: `**There was an error while handling the interaction**\n\`\`\`code: ${error.code}\nmessage: ${error.message}\`\`\``
						})
					}
				}
			}
		} else {
			return;
		}
	},
};