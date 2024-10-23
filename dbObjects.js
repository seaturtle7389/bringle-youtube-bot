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

// guildYoutubeChannelConstraint combines guild_id and youtube_id to make a unique constraint
// this means one guild can't have the same channel added twice
ServerGuild.hasMany(YoutubeChannel, {
	foreignKey: {
		allowNull: false,
		unique: 'guildYoutubeChannelConstraint',
		onDelete: 'CASCADE',
		underscored: true,
		name: "guild_id"
	}
})

YoutubeChannel.belongsTo(ServerGuild);

// channelVideoConstraint combines youtube_channel_id and youtube_id to make a unique constraint
// this means one channel instance (and one guild by extension) cannot have the same video added twice
// notably, the same channel added in a different guild would not have this restriction, so guilds can get notifications for the same video without issue
YoutubeChannel.hasMany(YoutubeVideo, {
	foreignKey: {
		allowNull: false,
		unique: 'channelVideoConstraint',
		onDelete: 'cascade',
		name: "youtube_channel_id"
	}
})

YoutubeVideo.belongsTo(YoutubeChannel)

module.exports = {sequelize, ServerGuild, YoutubeChannel, YoutubeVideo, DataTypes, Op}