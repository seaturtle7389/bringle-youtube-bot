const Sequelize = require('sequelize');

// set up database and import models
const sequelize = new Sequelize('youtube-bot', databaseUser, databasePassword, {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'database.sqlite',
});

require('../models/Guilds.js')(sequelize, Sequelize.DataTypes)
require('../models/YoutubeChannels.js')(sequelize, Sequelize.DataTypes)

// when running this file, pass the --force argument to force sync and rebuild all tables
const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	console.log('Database synced');
	sequelize.close();
}).catch(console.error);