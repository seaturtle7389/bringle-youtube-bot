'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('guilds', {
        id: {
          type: Sequelize.DataTypes.STRING,
          primaryKey: true
        },
        created_at: {
          type: Sequelize.DataTypes.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DataTypes.DATE,
          allowNull: false
        }
      }, 
      {
        transaction
      });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    try {
      const transaction = await queryInterface.sequelize.transaction();
      await queryInterface.dropTable('guilds', {transaction});
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
