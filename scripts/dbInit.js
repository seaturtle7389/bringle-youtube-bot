// all database config is stored in dbObjects.js
const {sequelize} = require('../dbObjects.js');

// when running this file, pass the --force argument to force sync and rebuild all tables
const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	console.log('Database synced');
	sequelize.close();
}).catch(console.error);