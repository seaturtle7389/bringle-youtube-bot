const path = require('node:path');
const fs = require('node:fs');
const envFileName = `.env.${process.env.APP_ENV || "development"}`
require('dotenv').config({ path: envFileName });

const { REST, Routes } = require('discord.js');
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

const commands = [];
// Grab all command folders from the commands directory
const foldersPath = path.join(__dirname, '../commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// command files from the commands directory 
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);


// deploy commands
(async () => {
	try {
		// when running this file, pass the --global argument to push commands to all servers the bot is in
		// otherwise, it will assume you should only deploy commands to the dev server specified in .env
		const global = process.argv.includes('--global') || process.argv.includes('-f');
		const clear = process.argv.includes('--clear');
		var data = null

		if(clear && global){
			// clear global commands
			console.log(`Started deleting all application (/) command(s) globally.`);
			await rest.put(Routes.applicationCommands(clientId), { body: [] })
				.then(() => console.log('Successfully deleted all application (/) commands.'))
				.catch(console.error);
		} else if (clear){
			// clear guild-based commands
			console.log(`Started deleting all application (/) command(s) in the dev guild.`);
			await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
				.then(() => console.log('Successfully deleted all application (/) commands in the dev guild.'))
				.catch(console.error);
		} else if (global){
			// fully refresh all commands in all guilds
			console.log(`Started refreshing ${commands.length} application (/) command(s) globally.`);
			data = await rest.put(
				Routes.applicationCommands(clientId),
				{ body: commands },
			);
			console.log(`Successfully reloaded ${data.length} application (/) command(s).`);
		} else {
			// fully refresh all commands in the dev guild
			console.log(`Started refreshing ${commands.length} application (/) command(s) in the dev guild.`);
			data = await rest.put(
				Routes.applicationGuildCommands(clientId, guildId),
				{ body: commands },
			);
			console.log(`Successfully reloaded ${data.length} application (/) command(s).`);
		}
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();