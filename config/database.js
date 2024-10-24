const fs = require('fs');
const envFileName = `.env.${process.env.APP_ENV || "development"}`
require('dotenv').config({ path: envFileName });

module.exports = {
    use_env_variable: false,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: 'localhost',
    dialect: 'sqlite',
    storage: process.env.DB_PATH
};