require('dotenv').config();

async function createYoutubeVideo(client, type, youtube_id, youtube_channel_id, title, scheduled_start_time, started){
    var YoutubeVideo = client.YoutubeVideo
    var  youtubeVideo = await YoutubeVideo.findOne({where: {youtube_id: youtube_id, youtube_channel_id: youtube_channel_id}});
    if (!youtubeVideo) {
        try{
            if(type == 'UPLOAD'){
                var newYoutubeVideo = await YoutubeVideo.create({
                    type: type,
                    youtube_id: youtube_id,
                    youtube_channel_id: youtube_channel_id,
                    title: title
                })
                console.log("Youtube video (type: upload) was added")
                return newYoutubeVideo;

            } else if(type == 'LIVESTREAM'){
                var newYoutubeVideo = await YoutubeVideo.create({
                    type: type,
                    youtube_id: youtube_id,
                    youtube_channel_id: youtube_channel_id,
                    title: title,
                    scheduled_start_time: scheduled_start_time,
                    started: started
                })
                console.log("Youtube video (type: livestream) was added")
                return newYoutubeVideo;
            }     
        }
        catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError'){
                console.log("Youtube video already exists")
            } else {
                console.log("Something went wrong when adding a Youtube video")
            }
        }  
    } else {
        console.log("Youtube video has already been added")
    }
    return null;
}

module.exports = {
    createYoutubeVideo
}