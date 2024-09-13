const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes){
    return sequelize.define('guild', {
        id: {
            type: Sequelize.STRING,
            primaryKey: true,
            unique: true,
            allowNull: false
        }
    })
}