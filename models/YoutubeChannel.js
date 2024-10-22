const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes){
    return sequelize.define('youtube_channel', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        youtube_id: {
            type: Sequelize.STRING,
            allowNull: false
        },
        youtube_handle: {
            type: Sequelize.STRING,
            allowNull: false
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },

        upload_channel_id: Sequelize.STRING,
        upload_announcement: Sequelize.STRING,
        upload_role_id: Sequelize.STRING,

        livestream_channel_id: Sequelize.STRING,
        livestream_announcement: Sequelize.STRING,
        scheduled_livestream_announcement: Sequelize.STRING,
        livestream_role_id: Sequelize.STRING,
    }, {underscored: true, timestamps: true},)
}