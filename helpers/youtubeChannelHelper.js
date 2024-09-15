require('dotenv').config();
const youtubeApiKey = process.env.YOUTUBE_API_KEY;
const youtubeApiUrl = 'https://www.googleapis.com/youtube/v3/channels?'
const fetch = require("node-fetch");

// params needed to only return the channel ID, used to validate a channel exists
const returnChannelIdParts = ['id'];
const returnChannelIdFields = ['items/id'];

// params needed to only return the relevant information we want when displaying channels
const returnChannelDetailsParts = ['id', 'snippet', 'statistics', 'contentDetails'];
const returnChannelDetailsFields = ['items/id', 'items/snippet/title', 'items/snippet/description', 'items/snippet/customUrl', 'items/snippet/thumbnails/default/url', 'items/statistics/subscriberCount', 'items/contentDetails/relatedPlaylists/uploads'];

async function validateYoutubeChannelId(channel_id) {
    console.log(`Polling for YouTube channel with ID of ${channel_id}`);
    const url = buildYoutubeApiRoute(returnChannelIdParts, returnChannelIdFields, [channel_id], 1);
    const response = await fetch(url);
    const myJson = await response.json();

    // if something exists in this json, the YouTube channel exists
    for (const prop in myJson) {
        if (Object.hasOwn(myJson, prop)) {
          return true;
        }
    }

    // if we didn't find anything, the YouTube channel does not exists
    return false;
}

async function createYoutubeChannel(client, name, guild_id, youtube_channel_id, upload_notif_channel_id, livestream_notif_channel_id){
    const YoutubeChannel = client.YoutubeChannel;

    var  clientYoutubeChannel = await YoutubeChannel.findOne({where: {youtube_channel_id: youtube_channel_id}});
    if (!clientYoutubeChannel) {
        try{
            const newYoutubeChannel = await YoutubeChannel.create({
                name: name,
                guild_id: guild_id,
                youtube_channel_id: youtube_channel_id,
                upload_channel_id: upload_notif_channel_id,
                notification_channel_id: livestream_notif_channel_id
            })
            console.log("Youtube channel was added")
            return newYoutubeChannel;
        }
        catch (error) {
            console.log("Something went wrong when adding a Youtube channel")
            console.error(error)
        }  
    } else {
        console.log("Youtube channel has already been added")
    }
    return null;
}

async function deleteYoutubeChannel(client, youtubeChannelId) {
    const YoutubeChannel = client.YoutubeChannel
    var  channel = await YoutubeChannel.findOne({where: {id: youtubeChannelId}});
    var name = channel.name;
    if (channel) {
        try{
            channel.destroy();
            console.log("YouTube channel was deleted")
            return name;
        }
        catch (error) {  
            console.log(`Something went wrong when deleting YouTube Channel with ID ${youtubeChannelId}`)
            return null;
        }  
    } else {
        console.log("YouTube channel does not exist")
        return "undefined";
    }
}

async function fetchYoutubeChannelsDetails(youtubeChannelIds){
    console.log(`Polling for a group of YouTube channels`);
    const url = buildYoutubeApiRoute(returnChannelDetailsParts, returnChannelDetailsFields, youtubeChannelIds, youtubeChannelIds.length);
    const response = await fetch(url);
    const myJson = await response.json();
    return myJson;
}

module.exports = {
    validateYoutubeChannelId, createYoutubeChannel, deleteYoutubeChannel, fetchYoutubeChannelsDetails
}

// read more about parameter options at https://developers.google.com/youtube/v3/docs/channels/list
function buildYoutubeApiRoute(parts, fields, ids, maxResults){
    url = "";
    // used to track if we should use & in strings or not, only the first parameter doesn't need it
    var itemUsed = false;
    
    // valid parts: id, snippet, statistics, contentDetails status
    // other parts may be supported but are outside the scope of this bot
    if (parts){
        url += `${itemUsed ? '&' : ''}part=`
        itemUsed = true;
        partsString = ''
        // the last part doesn't need the comma at the end
        parts.forEach((part, key, parts) => {
            if(!Object.is(parts.length - 1, key)){
                partsString += `${part},`;
            } else {
                partsString += part;
            }
        });
        // encode the string so that characters like , and / become %2C and %2F etc.
        url += encodeURIComponent(partsString)
    }

    // valid fields: kind, etag, pageInfo, items
    // in general the only thing we care about is items so cutting the other stuff out trims bloat
    // you can further specify sub-fields, for instance items/id will only show the id object under items
    // sub-fields can be chained together

    if (fields){
        url += `${itemUsed ? '&' : ''}fields=`
        itemUsed = true;
        fieldsString = ''
        // the last field doesn't need the comma at the end
        fields.forEach((field, key, fields) => {
            if(!Object.is(fields.length - 1, key)){
                fieldsString += `${field},`;
            } else {
                fieldsString += field;
            }
        });
        // encode the string so that characters like , and / become %2C and %2F etc.
        url += encodeURIComponent(fieldsString)
    }

    // ids are formatted differently and added individually, not under one section like the others
    ids.forEach((id) => {
        url += `${itemUsed ? '&' : ''}id=${id}`
    });

    // append max results and the API key at the end
    if(maxResults){
        url += `${itemUsed ? '&' : ''}maxResults=${maxResults}`
    }
    url += `&key=${youtubeApiKey}`

    return youtubeApiUrl + url;
}