require('dotenv').config();
const Sequelize = require('sequelize');
const databaseUser = process.env.DATABASE_USER;
const databasePassword = process.env.DATABASE_PASSWORD;
const DataTypes = Sequelize.DataTypes;
const Op = Sequelize.Op;

const sequelize = new Sequelize('youtube-bot', databaseUser, databasePassword, {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'database.sqlite',
});

const ServerGuild = require('./models/Guild.js')(sequelize, DataTypes)
const YoutubeChannel = require('./models/YoutubeChannel.js')(sequelize, DataTypes)
const YoutubeVideo = require('./models/YoutubeVideo.js')(sequelize, DataTypes)

ServerGuild.hasMany(YoutubeChannel, {
	onDelete: 'CASCADE'
})

// guildYoutubeChannelConstraint combines guild_id and youtube_id to make a unique constraint
// this means one guild can't have the same channel added twice
YoutubeChannel.belongsTo(ServerGuild, {
	foreignKey: {
		type: DataTypes.STRING,
		name: 'guild_id',
		allowNull: false,
		unique: 'guildYoutubeChannelConstraint'
	}
});

YoutubeChannel.hasMany(YoutubeVideo, {
	onDelete: 'CASCADE'
})

// channelVideoConstraint combines youtube_channel_id and youtube_id to make a unique constraint
// this means one channel instance (and one guild by extension) cannot have the same video added twice
// notably, the same channel added in a different guild would not have this restriction, so guilds can get notifications for the same video without issue
YoutubeVideo.belongsTo(YoutubeChannel, {
	foreignKey: {
		type: DataTypes.INTEGER,
		name: 'youtube_channel_id',
		allowNull: false,
		unique: 'channelVideoConstraint'
	}
})

module.exports = {sequelize, ServerGuild, YoutubeChannel, YoutubeVideo, DataTypes, Op}