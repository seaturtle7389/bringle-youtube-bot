const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes){
    return sequelize.define('youtube_channel', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING,
            unique: true,
            allowNull: false
        },
        guild_id: Sequelize.STRING,
        youtube_channel_id: {
            type: Sequelize.STRING,
            unique: true,
            allowNull: false
        },
        upload_channel_id: Sequelize.STRING,
        livestream_channel_id: Sequelize.STRING,
    })
}