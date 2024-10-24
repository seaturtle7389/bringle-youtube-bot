'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('youtube_channels', {
        id: {
          type: Sequelize.DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },

        youtube_id: {
            type: Sequelize.DataTypes.STRING,
            allowNull: false,
        },
        youtube_handle: {
            type: Sequelize.DataTypes.STRING,
            allowNull: false
        },

        name: {
            type: Sequelize.DataTypes.STRING,
            allowNull: false
        },
        video_check_interval: Sequelize.DataTypes.INTEGER,
        last_checked: Sequelize.DataTypes.DATE,

        upload_channel_id: Sequelize.DataTypes.STRING,
        upload_announcement: Sequelize.DataTypes.STRING,
        upload_role_id: Sequelize.DataTypes.STRING,

        livestream_channel_id: Sequelize.DataTypes.STRING,
        livestream_announcement: Sequelize.DataTypes.STRING,
        scheduled_livestream_announcement: Sequelize.DataTypes.STRING,
        livestream_role_id: Sequelize.DataTypes.STRING,

        created_at: {
          type: Sequelize.DataTypes.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DataTypes.DATE,
          allowNull: false
        },
        guild_id: {
          type: Sequelize.DataTypes.STRING,
          references: {model: 'guilds', key: 'id'},
		      onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          allowNull: false
        }
      },
      {
        transaction
      });
      await queryInterface.addConstraint('youtube_channels', {
          fields: ['youtube_id', 'guild_id'],
          type: 'unique',
          name: 'guildYoutubeChannelConstraint',
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
      await queryInterface.dropTable('youtube_channels', {transaction});
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
