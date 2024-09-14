require('dotenv').config();
const youtubeApiKey = process.env.YOUTUBE_API_KEY;
const youtubeApiUrl = 'https://www.googleapis.com/youtube/v3/channels?part=id&fields=items/id'
const fetch = require("node-fetch");

async function validateYoutubeChannelId(channel_id) {
    console.log(`Polling for YouTube channel with ID of ${channel_id}`);
    const url = `${youtubeApiUrl}&id=${channel_id}&key=${youtubeApiKey}`;
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

module.exports = {
    validateYoutubeChannelId
}