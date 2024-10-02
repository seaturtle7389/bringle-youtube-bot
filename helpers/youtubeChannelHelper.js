require('dotenv').config();
const youtubeApiKey = process.env.YOUTUBE_API_KEY;
const youtubeChannelApiUrl = 'https://www.googleapis.com/youtube/v3/channels?'
const youtubePlaylistApiUrl = 'https://youtube.googleapis.com/youtube/v3/playlistItems?'
const youtubeVideoApiUrl = 'https://youtube.googleapis.com/youtube/v3/videos?'
//const youtubeSearchApiUrl = 'https://youtube.googleapis.com/youtube/v3/search?'
const fetch = require("node-fetch");

// params needed to only return the channel ID, used to validate a channel exists
const returnChannelIdParts = ['id'];
const returnChannelIdFields = ['items/id'];

// params needed to only return the relevant information we want when displaying channels
const returnChannelDetailsParts = ['id', 'snippet', 'statistics', 'contentDetails'];
const returnChannelDetailsFields = ['items/id', 'items/snippet/title', 'items/snippet/description', 'items/snippet/customUrl', 'items/snippet/thumbnails/default/url', 'items/statistics/subscriberCount', 'items/contentDetails/relatedPlaylists/uploads'];

async function validateYoutubeChannelId(channel_id) {
    console.log(`Polling for YouTube channel with ID of ${channel_id}`);
    url = buildYoutubeApiChannelRoute(returnChannelIdParts, returnChannelIdFields, [channel_id], 1);
    response = await fetch(url);
    myJson = await response.json();

    // if something exists in this json, the YouTube channel exists
    for (prop in myJson) {
        if (Object.hasOwn(myJson, prop)) {
          return true;
        }
    }

    // if we didn't find anything, the YouTube channel does not exists
    return false;
}

async function createYoutubeChannel(client, name, guild_id, youtube_channel_id, upload_notif_channel_id, livestream_notif_channel_id){
    var YoutubeChannel = client.YoutubeChannel;

    var  clientYoutubeChannel = await YoutubeChannel.findOne({where: {youtube_channel_id: youtube_channel_id}});
    if (!clientYoutubeChannel) {
        try{
            var newYoutubeChannel = await YoutubeChannel.create({
                name: name,
                guild_id: guild_id,
                youtube_channel_id: youtube_channel_id,
                upload_channel_id: upload_notif_channel_id,
                livestream_channel_id: livestream_notif_channel_id
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
    var YoutubeChannel = client.YoutubeChannel
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

/* This function is useable but takes WAY too much YouTube API quota to be worth it
async function fetchYoutubeChannelLivestreams(youtubeChannelId){
    console.log('Searching for a channel\'s livestreams')
    url = youtubeSearchApiUrl + `part=snippet&channelId=${youtubeChannelId}&eventType=live&order=date&maxResults=1&type=video&key=${youtubeApiKey}`
    var response = await fetch(url);
    var myJson = await response.json();
    console.log(url);
    console.log(response);
    console.log(myJson);
    return myJson;
}
*/ 

async function fetchAllYoutubeChannelVideos(youtubeChannelId){
    response = await fetchYoutubeChannelsDetails([youtubeChannelId]);
    channelDetails = response.items;
    uploadPlaylistId = channelDetails[0].contentDetails.relatedPlaylists.uploads;

    videoIds = [];
    nextPageToken = null;
    response = await fetchYoutubePlaylistDetails(uploadPlaylistId, 50, null);
    do {
        // the first iteration will never re-fetch the response
        // if we keep looping due to more pages, it'll continue proceeding through the playlist until we reach the end
        if(nextPageToken != null){
            response = await fetchYoutubePlaylistDetails(uploadPlaylistId, 50, nextPageToken)
        }
        nextPageToken = response.nextPageToken;
        items = response.items;

        items.forEach((i) => {
            videoIds.push(i.contentDetails.videoId)
        });

    } while (nextPageToken != null);
    chunkedVideoIds = chunkArray(videoIds, 50);
    videoDetails = []
    for(chunk of chunkedVideoIds){
        response = await fetchYoutubeVideoDetails(chunk, 50, null);
        for (item of response.items){
            videoDetails.push(item);
        }
    }
    return videoDetails;
}

// this function technically could grab more than one item if you wanted to check two or three latest videos
async function fetchLatestYoutubeChannelVideos(youtubeChannelId){
    response = await fetchYoutubeChannelsDetails([youtubeChannelId]);
    channelDetails = response.items;
    uploadPlaylistId = channelDetails[0].contentDetails.relatedPlaylists.uploads;

    videoIds = [];
    response = await fetchYoutubePlaylistDetails(uploadPlaylistId, 1, null);
    for (item of response.items){
        videoIds.push(item.contentDetails.videoId)
    };

    videoDetails = []
    response = await fetchYoutubeVideoDetails(videoIds, 1, null);
    for (item of response.items){
        videoDetails.push(item);
    }
    
    return videoDetails;
}

async function fetchYoutubeChannelsDetails(youtubeChannelIds){
    //console.log(`Polling for a group of YouTube channels`);
    url = buildYoutubeApiChannelRoute(returnChannelDetailsParts, returnChannelDetailsFields, youtubeChannelIds, youtubeChannelIds.length);
    response = await fetch(url);
    myJson = await response.json();
    return myJson;
}



module.exports = {
    validateYoutubeChannelId, createYoutubeChannel, deleteYoutubeChannel, fetchYoutubeChannelsDetails, /*fetchYoutubeChannelLivestreams,*/ fetchAllYoutubeChannelVideos, fetchLatestYoutubeChannelVideos
}

// gets the x most recent videos from a playlist
// generally this is useful by just using a channel's "uploads" playlist to get their most recent video
async function fetchYoutubePlaylistDetails(playlistId, maxResults, pageToken = null){
    if(pageToken == null){
        url = youtubePlaylistApiUrl + `part=contentDetails&maxResults=${maxResults}&playlistId=${playlistId}&key=${youtubeApiKey}`
    } else {
        url = youtubePlaylistApiUrl + `part=contentDetails&maxResults=${maxResults}&pageToken=${pageToken}&playlistId=${playlistId}&key=${youtubeApiKey}`
    }
    response = await fetch(url);
    myJson = await response.json();
    return myJson;
}

async function fetchYoutubeVideoDetails(youtubeVideoIds, maxResults, pageToken = null){
    videoIdsString = "";
    youtubeVideoIds.forEach(function (id, i) {
        videoIdsString += id;
        // comma separate the values
        if(i + 1< youtubeVideoIds.length){
            videoIdsString += ","
        }
    });
    videoIdsString = encodeURIComponent(videoIdsString)
    url = youtubeVideoApiUrl + `part=liveStreamingDetails%2Cstatus&id=${videoIdsString}&maxResults=${maxResults}&key=${youtubeApiKey}`
    response = await fetch(url);
    myJson = await response.json();
    return myJson;
}

// read more about parameter options at https://developers.google.com/youtube/v3/docs/channels/list
function buildYoutubeApiChannelRoute(parts, fields, ids, maxResults){
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

    return youtubeChannelApiUrl + url;
}

function chunkArray(array, chunkSize) {
    return Array.from(
      { length: Math.ceil(array.length / chunkSize) },
      (_, index) => array.slice(index * chunkSize, (index + 1) * chunkSize)   
    );
  }