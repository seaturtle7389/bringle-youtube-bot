const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes){
    return sequelize.define('guild', {
        id: {
            type: Sequelize.STRING,
            primaryKey: true,
            unique: true,
            allowNull: false
        },
        upload_channel_id: Sequelize.STRING,
        notification_channel_id: Sequelize.STRING,
    })
}