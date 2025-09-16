'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, DataTypes) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('youtube_channels', 'short_upload_role_id', {
        type: DataTypes.STRING,
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

  async down (queryInterface, DataTypes) {
    try {
      const transaction = await queryInterface.sequelize.transaction();
      await queryInterface.removeColumn('youtube_channels', 'short_upload_role_id', {transaction});
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
