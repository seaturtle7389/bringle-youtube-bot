require('dotenv').config();
const Sequelize = require('sequelize');
const fs = require('node:fs');
const path = require('node:path');
const fetch = require("node-fetch");
const express = require('express')
const { Client, Collection, /*Events,*/ GatewayIntentBits } = require('discord.js');

const youtubeApiKey = process.env.YOUTUBE_API_KEY;
const youtubeApiUrl = 'https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video';
const discordToken = process.env.DISCORD_TOKEN;
const databaseUser = process.env.DATABASE_USER;
const databasePassword = process.env.DATABASE_PASSWORD;

const app = express();
const port = process.env.PORT || 3000;
const youtubeFetchTimeout = 5000;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.request = new (require("rss-parser"))();

// set up database and import models
const sequelize = new Sequelize('youtube-bot', databaseUser, databasePassword, {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'database.sqlite',
});
const ServerGuilds = require(path.join(__dirname, "models/guild.js"))(sequelize, Sequelize.DataTypes)
client.ServerGuilds = ServerGuilds

//import commands from the commands directory s
client.commands = new Collection();
client.cooldowns = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

//import events from the events directory
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

async function createServerGuildIfNotExists(client, guildId) {
    const serverGuilds = client.ServerGuilds
    const serverGuild = await ServerGuilds.findOne({where: {id: guildId}});
    if (!serverGuild) {
        try{
            const newServerGuild = await ServerGuilds.create({
                id: guildId
            })
            console.log("Guild was added")
        }
        catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError'){
                console.log("Guild already exists")
            } else {
                console.log("Something went wrong when adding a guild")
            }
        }  
    } else {
        console.log("Guild has already been added")
    }
}

// export these functions to other files as needed
module.exports = {
    createServerGuildIfNotExists
}

client.login(discordToken);

/*const youtubeChannels = [
    {
        channelId: 'UCOykvWPPCoxvY0p-KPrQqSQ',
        channelUrl: 'https://www.youtube.com/channel/UCOykvWPPCoxvY0p-KPrQqSQ'
    }
];

let activeLiveStreams = new Set();

async function fetchLiveStreamStatus() {
    try {
        // for(const youtubeChannel of youtubeChannels) {
            const youtubeChannel = youtubeChannels[0];
            console.log('Polling for ', JSON.stringify(youtubeChannel));
            const url = `${youtubeApiUrl}&channelId=${youtubeChannel.channelId}&key=${youtubeApiKey}`;
            const response = await fetch(url);
            const myJson = await response.json();
            
            console.log('YouTube Response', JSON.stringify(myJson));
            if(myJson && myJson.pageInfo && myJson.pageInfo.totalResults > 0) {
                console.log('Found active stream for ', youtubeChannel.channelId);
                myJson.items.forEach(element => {
                    if(!activeLiveStreams.has(element.id.videoId)) {
                        console.log(element);
                        activeLiveStreams.add(element.id.videoId);
    
                        const discordObj = {
                            username: 'Dumpster LIVE',
                            avatar_url: 'https://yt3.ggpht.com/a/AGF-l7__zvPRgglwpeA85-NPjkxRlhi46IG3wKdwKg=s288-c-k-c0xffffffff-no-rj-mo',
                            content: `Richlife is LIVE. **${element.snippet.title}**. Channel: ${youtubeChannel.channelUrl}`
                        }
                        postToDiscord(discordObj);
                    } else {
                        console.log(`Already alerted for this livestream ${element.id.videoId}. Skipping.`);
                    }
                });
            } else {
                const discordObj = {
                    username: 'No one is live :(',
                    avatar_url: 'https://yt3.ggpht.com/a/AGF-l7__zvPRgglwpeA85-NPjkxRlhi46IG3wKdwKg=s288-c-k-c0xffffffff-no-rj-mo',
                    content: `Richlife is NOT LIVE.`
                }
                postToDiscord(discordObj);
            }
        // }
    } catch (error) {
        console.error(error);
    }
}*/

/*function handleUploads() {
    if (client.db.fetch(`postedVideos`) === null) client.db.set(`postedVideos`, []);
    setInterval(() => {
        client.request.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${client.config.channel_id}`)
        .then(data => {
            if (client.db.fetch(`postedVideos`).includes(data.items[0].link)) return;
            else {
                client.db.set(`videoData`, data.items[0]);
                client.db.push("postedVideos", data.items[0].link);
                let parsed = client.db.fetch(`videoData`);
                let channel = client.channels.cache.get(client.config.channel);
                if (!channel) return;
                let message = client.config.messageTemplate
                    .replace(/{author}/g, parsed.author)
                    .replace(/{title}/g, Discord.Util.escapeMarkdown(parsed.title))
                    .replace(/{url}/g, parsed.link);
                channel.send(message);
            }
        });
    }, client.config.watchInterval);
}*/

/*app.get('/', (req, res) => res.send('Shhh! Im busy monitoring Youtube Channels.'));
app.listen(port, () => {
    console.log(`App listening on port ${port}!`)
    setInterval(fetchLiveStreamStatus, youtubeFetchTimeout);
})*/