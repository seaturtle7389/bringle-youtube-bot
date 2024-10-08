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
		} else {
			return;
		}
	},
};