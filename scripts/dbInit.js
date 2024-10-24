// all database config is stored in dbObjects.js
const {sequelize} = require('../db/dbObjects.js');

// when running this file, pass the --force argument to force sync and rebuild all tables
// this should not be done in production!!!! development only, and only when testing!!!
// migrations should be used most of the time
const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	console.log('Database synced');
	sequelize.close();
}).catch(console.error);