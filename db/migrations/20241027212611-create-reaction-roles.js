'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('reaction_roles', {
        id: {
          type: Sequelize.DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        role_id: {
            type: Sequelize.DataTypes.STRING,
            allowNull: false,
            unique: true
        },

        emoji_id: {
            type: Sequelize.DataTypes.STRING,
        },

        name: {
          type: Sequelize.DataTypes.STRING,
          required: true
      },

        created_at: {
          type: Sequelize.DataTypes.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DataTypes.DATE,
          allowNull: false
        },
        role_menu_id: {
          type: Sequelize.DataTypes.INTEGER,
          references: {model: 'role_menus', key: 'id'},
		      onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
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
      await queryInterface.dropTable('reaction_roles', {transaction});
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
