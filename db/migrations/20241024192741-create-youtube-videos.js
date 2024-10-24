'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('youtube_videos', {
        id: {
          type: Sequelize.DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        type: {
            type: Sequelize.DataTypes.ENUM('UPLOAD', 'LIVESTREAM'),
            allowNull: false
        },
        
        youtube_id: {
            type: Sequelize.DataTypes.STRING,
            allowNull: false
        },
        title: {
            type: Sequelize.DataTypes.STRING,
            allowNull: false
        },

        scheduled_start_time: Sequelize.DataTypes.DATE,
        started: Sequelize.DataTypes.BOOLEAN,

        created_at: {
          type: Sequelize.DataTypes.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DataTypes.DATE,
          allowNull: false
        },
        youtube_channel_id: {
          type: Sequelize.DataTypes.STRING,
          references: {model: 'youtube_channels', key: 'id'},
		      onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          allowNull: false
        }
      },
      {
        transaction
      });
      await queryInterface.addConstraint('youtube_videos', {
          fields: ['youtube_id', 'youtube_channel_id'],
          type: 'unique',
          name: 'channelVideoConstraint',
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
      await queryInterface.dropTable('youtube_videos', {transaction});
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
