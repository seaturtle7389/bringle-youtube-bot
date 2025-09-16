const envFileName = `.env.${process.env.APP_ENV || "development"}`
require('dotenv').config({ path: envFileName });
console.log(`Starting app using ${envFileName}`)
const discordToken = process.env.DISCORD_TOKEN;

const fs = require('node:fs');
const path = require('node:path');
const moment = require('moment');
moment().format();

// import database models
const {ServerGuild, YoutubeChannel, YoutubeVideo, RoleMenu, ReactionRole, Op } = require('./db/dbObjects.js')

// import helper
const youtubeChannelHelper = require('./helpers/youtubeChannelHelper');
const youtubeVideoHelper = require('./helpers/youtubeVideoHelper');

const youtubeFetchTimeout = process.env.YOUTUBE_FETCH_INTERVAL;

const { Client, Collection, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// attach these to client so they're accessible in events and commands
client.ServerGuild = ServerGuild;
client.YoutubeChannel = YoutubeChannel;
client.YoutubeVideo = YoutubeVideo;
client.RoleMenu = RoleMenu;
client.ReactionRole = ReactionRole;
client.Op = Op;

//import commands from the commands directory sf
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

client.login(discordToken);

setInterval(fetchLatestYoutubeVideos, youtubeFetchTimeout);



async function checkAllYoutubePlaylists(){
    var youtubeChannelPlaylistIds = [];
    var youtubeVideoIds = []

    guilds = await ServerGuild.findAll();
    for (g of guilds) {
        var youtubeChannels = await YoutubeChannel.findAll({where: {guild_id: g.id}})
        // TODO: make a YoutubeChannel method that checks if there's at least one valid notification set up
            if(yt.livestream_channel_id != null || yt.upload_channel_id != null){
                // TODO: add youtube playlist ID field to YoutubeChannel object and save it when the channel is initialized
                // TODO: insert playlist ID into youtubeChannelPlaylistIds
            }
    };

    // TODO: make a youtubeChannelHelper method that fetches all playlists by using the array of playlist IDs we pass in
    // TODO: iterate over each playlist
        // TODO: we should only be getting the latest video from the channel here assuming it works correctly
        // store the video ID in youtubeVideoIds

    // TODO: make a youtubeChannelHelper that fetches all videos by using the array of video IDs we pass in
    var videoDetails = [];
    // TODO: iterate over each video
    // TODO: youtubeVideoIds is the wrong variable to use here but idk what I want to name the actual variable so it works for now
    
    for (v of videoDetails){
        // TODO: get channel ID from video details
        var channel_id = 1;
        var youtube_video_id = 1;

        var channel = await YoutubeChannel.findOne({where: {id: channel_id}});        

        // if we couldn't find a channel associated with this video, no need to try to do anything else this iteration so we can call continue
        // honestly idk how we'd hit 
        // this issue as it stands right now but it's a safeguard I guess
        if(channel == null) continue;

        // if we do find a channel, mark that we've checked it for videos as of this time just for reference
        channel = await channel.update({
            last_checked: Date.now()
        });

        // check to see if we've encountered this video before
        var existingYoutubeVideo = await YoutubeVideo.findOne({where: {youtube_channel_id: channel_id, youtube_id: youtube_video_id}});

        // TODO: this video exists in the database, we should check if it's a livestream
        // TODO: if it is a livestream, check to see if it's active
        // TODO: if it is active, update it in the database and then make a post

        // TODO: create a youtubeVideoHelper function that can determine if a video is a short, livestream, or upload
        // TODO: allow the shorts length config to be set per-server? or per channel maybe?
        // TODO: check to make sure that we have notifications set up for the correct video type
        // TODO: create a video record in the database and then post about the video

    }
};


async function fetchLatestYoutubeVideos(){
    guilds = await ServerGuild.findAll();
    for (g of guilds) {
        var youtubeChannels = await YoutubeChannel.findAll({where: {guild_id: g.id}})
        for (yt of youtubeChannels) {
            // only proceed if we're past the timeout interval specified for this channel, and a notification channel is set up
            if(yt.checkVideoInterval() && (yt.livestream_channel_id != null || yt.upload_channel_id != null)){
                var videoDetails = await youtubeChannelHelper.fetchLatestYoutubeChannelVideos(yt.youtube_id);
                // once we've grabbed the data, store the timestamp
                yt = await yt.update({
					last_checked: Date.now()
				})

                if(yt.livestream_channel_id != null){
                    var livestream_channel = client.channels.cache.get(yt.livestream_channel_id);
                } else {
                    var livestream_channel = null;
                }

                if(yt.upload_channel_id != null){
                    var upload_channel = client.channels.cache.get(yt.upload_channel_id);
                } else {
                    var upload_channel = null;
                }

                for(video of videoDetails){
                    var youtubeVideoId = video.id;
                    var youtubeVideoTitle = video.snippet.title;
                    var existingYoutubeVideo = await YoutubeVideo.findOne({where: {youtube_channel_id: yt.id, youtube_id: youtubeVideoId}});

                    // we've already seen this video, just check to see if it's a livestream that hadn't started before
                    if(existingYoutubeVideo != null){
                        console.log(`Video already saved: ${yt.name} | ${youtubeVideoTitle} (Database ID: ${existingYoutubeVideo.id})`)
                        if(existingYoutubeVideo.type == 'LIVESTREAM' && existingYoutubeVideo.started == false){
                            console.log('Checking to see if livestream is live now and if we should post it')
                            var livestreamDetails = video.liveStreamingDetails;
                            if(livestreamDetails != null && livestreamDetails.actualStartTime != null && livestream_channel != null){
                                

                                existingYoutubeVideo = await existingYoutubeVideo.update({
                                    title: youtubeVideoTitle,
                                    scheduled_start_time: livestreamDetails.actualStartTime,
                                    started: true
                                })

                                var message = yt.buildStreamNotification(existingYoutubeVideo.getUrl(), existingYoutubeVideo.title);
                                await livestream_channel.send(message);
                            }
                        }
                    } else {
                        console.log(`New video from ${yt.name} | ${youtubeVideoTitle} (YouTube ID: ${video.id})`)
                        // check to see if the video is a livestream, then confirm we have livestream notifs enabled
                        var livestreamDetails = video.liveStreamingDetails;
                        if(livestreamDetails != null && livestream_channel != null){
                            // an actual start time means that the video is live right now
                            if(livestreamDetails.actualStartTime != null){
                                var newYoutubeVideo = await youtubeVideoHelper.createYoutubeVideo(client, 'LIVESTREAM', video.id, yt.id, youtubeVideoTitle, livestreamDetails.actualStartTime, true)
                                if(newYoutubeVideo){
                                    var message = yt.buildStreamNotification(newYoutubeVideo.getUrl(), newYoutubeVideo.title);
                                    await livestream_channel.send(message);
                                } else {
                                    console.log("Video was unable to be saved due to an unexpected error")
                                }
                            } else {
                                var newYoutubeVideo = await youtubeVideoHelper.createYoutubeVideo(client, 'LIVESTREAM', video.id, yt.id, youtubeVideoTitle, livestreamDetails.scheduledStartTime, false)
                                if(newYoutubeVideo){
                                    var message = yt.buildScheduledStreamNotification(newYoutubeVideo.getUrl(), newYoutubeVideo.title, Math.floor(newYoutubeVideo.scheduled_start_time/1000));
                                    await livestream_channel.send(message);
                                } else {
                                    console.log("Video was unable to be saved due to an unexpected error")
                                }
                            }                            
                        // the video is an upload, confirm we have upload notifs enabled
                        } else if(upload_channel != null){
                            var youtubeVideoDuration = moment.duration(video.contentDetails.duration);
                            // send different notifications for shorts (videos less than 3 minutes)
                            if(youtubeVideoDuration.asSeconds() > 180){
                                var newYoutubeVideo = await youtubeVideoHelper.createYoutubeVideo(client, 'UPLOAD', video.id, yt.id, youtubeVideoTitle, null, null)
                                if(newYoutubeVideo){
                                    var message = yt.buildUploadNotification(newYoutubeVideo.getUrl(), newYoutubeVideo.title);
                                    await upload_channel.send(message);
                                } else {
                                    console.log("Video was unable to be saved due to an unexpected error")
                                }
                            } else {
                                var newYoutubeVideo = await youtubeVideoHelper.createYoutubeVideo(client, 'UPLOAD', video.id, yt.id, youtubeVideoTitle, null, null)
                                if(newYoutubeVideo){
                                    var message = yt.buildShortUploadNotification(newYoutubeVideo.getUrl(), newYoutubeVideo.title);
                                    await upload_channel.send(message);
                                } else {
                                    console.log("Video was unable to be saved due to an unexpected error")
                                }
                            }  
                        }
                    }   
                }
            } 
        };
    }; 
}