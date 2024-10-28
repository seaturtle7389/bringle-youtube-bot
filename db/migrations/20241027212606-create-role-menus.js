'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('role_menus', {
        id: {
          type: Sequelize.DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        type: {
          type: Sequelize.DataTypes.ENUM('DROPDOWN', 'BUTTON'),
          allowNull: false
        },
        channel_id: {
          type: Sequelize.DataTypes.STRING,
          allowNull: false      },
        message_id: {
            type: Sequelize.DataTypes.STRING,
            allowNull: false,
            unique: true
        },

        title: {
            type: Sequelize.DataTypes.STRING,
            allowNull: false,
            unique: ''
        },

        text: {
          type: Sequelize.DataTypes.STRING,
      },

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
      await queryInterface.addConstraint('role_menus', {
        fields: ['title', 'guild_id'],
        type: 'unique',
        name: 'guildRoleMenuConstraint',
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
      await queryInterface.dropTable('role_menus', {transaction});
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
