require('dotenv').config();
const youtubeFetchTimeout = process.env.YOUTUBE_FETCH_INTERVAL;

module.exports = function(sequelize, DataTypes){
    const YoutubeChannel = sequelize.define('youtube_channel', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        youtube_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: 'guildYoutubeChannelConstraint'
        },
        youtube_handle: {
            type: DataTypes.STRING,
            allowNull: false
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        video_check_interval: DataTypes.INTEGER,
        last_checked: DataTypes.DATE,

        upload_channel_id: DataTypes.STRING,
        upload_announcement: DataTypes.STRING,
        upload_role_id: DataTypes.STRING,

        livestream_channel_id: DataTypes.STRING,
        livestream_announcement: DataTypes.STRING,
        scheduled_livestream_announcement: DataTypes.STRING,
        livestream_role_id: DataTypes.STRING,
    }, 
    {   underscored: true, 
        timestamps: true,
        beforeSave: (youtubeChannel, options) => {
            // remove @ symbol from handles, then put a single one at the front
            var str = youtubeChannel.youtube_handle.replaceAll('@', '');
            youtubeChannel.youtube_handle = "@" + str;
        },
        validate: {
            // only allow values for upload_announcement and upload_role_id if upload_channel_id is set
            checkUploadFields() {
                if (this.upload_channel_id == null){
                    var invalidUploadFields = []
                    this.uploadFields().forEach(function(value){
                        if(value[1] != null) invalidUploadFields.push(value[0]);
                    })

                    if (invalidUploadFields.length > 0){
                        throw new Error(`${invalidUploadFields.length > 1 ? "Fields" : "Field"} ${invalidUploadFields.join(', ')} can only be set if upload_channel_id is not null.`)
                    }
                }
            },
            // only allow values for livestream_announcement, scheduled_livestream_announcement, and livestream_role_id if livestream_channel_id is set
            checkLivestreamFields() {
                if (this.livestream_channel_id == null){
                    var invalidLivestreamFields = []
                    this.livestreamFields().forEach(function(value){
                        if(value[1] != null) invalidLivestreamFields.push(value[0]);
                    })

                    if (invalidLivestreamFields.length > 0){
                        throw new Error(`${invalidLivestreamFields.length > 1 ? "Fields" : "Field"} ${invalidLivestreamFields.join(', ')} can only be set if livestream_channel_id is not null.`)
                    }
                }
            }
        }
    })

    //
    // class methods
    //

    // define the default upload notification
    YoutubeChannel.defaultUploadString = function() {
        return "## {channelName} just uploaded a new video! {role}\n**{videoTitle}**\n{videoUrl}";
    }

    // define the default livestream notification
    YoutubeChannel.defaultLivestreamString = function() {
        return "## {channelName} is live! {role}\n**{videoTitle}**\n{videoUrl}";
    }

    // define the default livestream scheduled notification
    YoutubeChannel.defaultScheduledLivestreamString = function() {
        return "## {channelName} has scheduled a livestream for {timestamp}! {role}\n**{videoTitle}**\n{videoUrl}";
    }

    //
    // instance methods
    //

    // returns true if we're past the interval needed to check for videos
    YoutubeChannel.prototype.checkVideoInterval = function(){
        if(this.last_checked == null){
            return true
        } else {
            var now = Date.now();
            if(this.video_check_interval != null && this.video_check_interval > 0){
                var intervalInMilliseconds = this.video_check_interval * 60 * 1000;
            } else {
                var intervalInMilliseconds = parseInt(youtubeFetchTimeout);
            }
            var nextCheckTime = this.last_checked.getTime() + intervalInMilliseconds;
            return now > nextCheckTime;
        }
     }

    // return upload fields
    YoutubeChannel.prototype.uploadFields = function(){
        return [["'upload_announcement'", this.upload_announcement], 
                ["'upload_role_id'", this.upload_role_id]]
    }

    // return livestream fields
    YoutubeChannel.prototype.livestreamFields = function(){
        return [["'livestream_announcement'", this.livestream_announcement], 
                ["'scheduled_livestream_announcement'", this.scheduled_livestream_announcement], 
                ["'livestream_role_id'", this.livestream_role_id]]
    }

    // get channel URL
    YoutubeChannel.prototype.getUrl = function(){
        return `https://youtube.com/${this.youtube_handle}`;
    }

    // build the upload notification message
    YoutubeChannel.prototype.buildUploadNotification = function(videoUrl, videoTitle){
        // if the channel doesn't have a custom announcement, use the default
        if(this.upload_announcement != null){
            str = this.upload_announcement;
        } else {
            str = YoutubeChannel.defaultUploadString();
        }

        // insert role ping into {role} placeholder
        str = str.replaceAll("{role}", this.upload_role_id == null ? "" : `<@&${this.upload_role_id}>`);
        // insert channel name into {channelName} placeholder
        str = str.replaceAll("{channelName}", this.name);
        // insert video title into {videoTitle} placeholder
        str = str.replaceAll("{videoTitle}", videoTitle);
        // insert video url into {videoUrl} placeholder
        str = str.replaceAll("{videoUrl}", videoUrl);
        // insert linebreaks
        str = str.replaceAll("{break}", "\n");

        return str;
    }

    // build the livestream notification message
    YoutubeChannel.prototype.buildStreamNotification = function(videoUrl, videoTitle){
        // if the channel doesn't have a custom announcement, use the default
        if(this.livestream_announcement != null){
            str = this.livestream_announcement;
        } else {
            str = YoutubeChannel.defaultLivestreamString();
        }

        // insert role ping into {role} placeholder
        str = str.replaceAll("{role}", this.livestream_role_id == null ? "" : `<@&${this.livestream_role_id}>`);
        // insert channel name into {channelName} placeholder
        str = str.replaceAll("{channelName}", this.name);
        // insert video title into {videoTitle} placeholder
        str = str.replaceAll("{videoTitle}", videoTitle);
        // insert video url into {videoUrl} placeholder
        str = str.replaceAll("{videoUrl}", videoUrl);
        // insert linebreaks
        str = str.replaceAll("{break}", "\n");

        return str;
    }

    // build the scheduled livestream notification message
    YoutubeChannel.prototype.buildScheduledStreamNotification = function(videoUrl, videoTitle, unixTimestamp){
        // if the channel doesn't have a custom scheduled announcement, use the default
        if(this.scheduled_livestream_announcement != null){
            str = this.scheduled_livestream_announcement;
        } else {
            str = YoutubeChannel.defaultScheduledLivestreamString();
        }

        // insert role ping into {role} placeholder
        str = str.replaceAll("{role}", this.livestream_role_id == null ? "" : `<@&${this.livestream_role_id}>`);
        // insert channel name into {channelName} placeholder
        str = str.replaceAll("{channelName}", this.name);
        // insert video title into {videoTitle} placeholder
        str = str.replaceAll("{videoTitle}", videoTitle);
        // insert video url into {videoUrl} placeholder
        str = str.replaceAll("{videoUrl}", videoUrl);
        // insert timestamp into {timestamp} placeholder
        str = str.replaceAll("{timestamp}", `<t:${unixTimestamp}:f>`);
        // insert linebreaks
        str = str.replaceAll("{break}", "\n");

        return str;
    }

    return YoutubeChannel;
}