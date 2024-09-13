require('dotenv').config();
const Sequelize = require('sequelize');
const databaseUser = process.env.DATABASE_USER;
const databasePassword = process.env.DATABASE_PASSWORD;

const sequelize = new Sequelize('youtube-bot', databaseUser, databasePassword, {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'database.sqlite',
});

const ServerGuild = require('./models/Guild.js')(sequelize, Sequelize.DataTypes)
const YoutubeChannel = require('./models/YoutubeChannel.js')(sequelize, Sequelize.DataTypes)

ServerGuild.hasMany(YoutubeChannel, {
	foreignKey: {
		allowNull: false
	}
})

YoutubeChannel.belongsTo(ServerGuild);

module.exports = {ServerGuild, YoutubeChannel}