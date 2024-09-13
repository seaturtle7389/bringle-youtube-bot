require('dotenv').config();
const Sequelize = require('sequelize');
const databaseUser = process.env.DATABASE_USER;
const databasePassword = process.env.DATABASE_PASSWORD;

// set up database and import models
const sequelize = new Sequelize('youtube-bot', databaseUser, databasePassword, {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'database.sqlite',
});

require('../models/Guild.js')(sequelize, Sequelize.DataTypes)
require('../models/YoutubeChannel.js')(sequelize, Sequelize.DataTypes)

// when running this file, pass the --force argument to force sync and rebuild all tables
const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	console.log('Database synced');
	sequelize.close();
}).catch(console.error);