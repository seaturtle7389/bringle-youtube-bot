const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes){
    const YoutubeVideo =  sequelize.define('youtube_video', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        type: {
            type: DataTypes.ENUM('UPLOAD', 'LIVESTREAM'),
            allowNull: false
        },
        
        youtube_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: 'channelVideoConstraint',
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },

        scheduled_start_time: DataTypes.DATE,
        started: DataTypes.BOOLEAN,
    }, 
    {   underscored: true, 
        timestamps: true, 
        validate: {
            // require scheduled_start_time and started if the video is a livestream
            // and don't allow them if the video is not a livestream
            checkLivestreamFields() {
                var invalidLivestreamFields = []
                if (this.type == 'LIVESTREAM'){
                    this.livestreamFields.forEach(function(value){
                        if(value[1] == null) invalidLivestreamFields.push(value[0]);
                    })
                    if (invalidLivestreamFields.length > 0){
                        throw new Error(`${invalidLivestreamFields.length > 1 ? "Fields" : "Field"} ${invalidLivestreamFields.join(', ')} must be set on videos of type LIVESTREAM.`)
                    }
                } else {
                    this.livestreamFields.forEach(function(value){
                        if(value[1] != null) invalidLivestreamFields.push(value[0]);
                    })
                    if (invalidLivestreamFields.length > 0){
                        throw new Error(`${invalidLivestreamFields.length > 1 ? "Fields" : "Field"} ${invalidLivestreamFields.join(', ')} can only be set on videos of type LIVESTREAM.`)
                    }
                }
            }
        }
    })

    //
    // class methods
    //

    //
    // instance methods
    //

    // return livestream fields
    YoutubeVideo.prototype.livestreamFields = function() {
        return [["'scheduled_start_time'", this.scheduled_start_time], ["'started'", this.started]];
    }

    // get video URL
    YoutubeVideo.prototype.getUrl = function(){
        return `https://youtu.be/${this.youtube_id}`;
    }

    return YoutubeVideo;
}
