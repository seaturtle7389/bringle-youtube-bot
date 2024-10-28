const envFileName = `.env.${process.env.APP_ENV || "development"}`
require('dotenv').config({ path: envFileName });
const { EmbedBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = function(sequelize, DataTypes){
    const RoleMenu = sequelize.define('role_menu', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        type: {
            type: DataTypes.ENUM('DROPDOWN', 'BUTTON'),
            allowNull: false
        },
        channel_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        message_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },   

        title: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: 'guildRoleMenuConstraint'
        },

        text: {
            type: DataTypes.STRING
        }

    }, 
    {   underscored: true, 
        timestamps: true,
        validate: {
            
        }
    })

    //
    // class methods
    //

    RoleMenu.defaultText = function(type = null) {
        var message = 'Select your role(s) below!';
        if(type == 'BUTTON'){
            message = 'Use the buttons below to assign yourself roles.';
        } else if(type == 'DROPDOWN'){
            message = 'Use the dropdown below to assign yourself a role.'
        }
        return message;
    }

    //
    // instance methods
    //

    RoleMenu.prototype.buildActionRow = async function() {
        var unused_emoji_index = 0;
        var emojis = ['🔷', '🔴', '🟩', '🔶', '⚫', '⬜'];
        var reactionRoles = await this.getReaction_roles();

        if (reactionRoles == null || reactionRoles.length == 0){
            return null;
        }

        if (this.type == "BUTTON"){
            const row = new ActionRowBuilder();
            for(role of reactionRoles){
                var emoji = await role.getEmojiObject();
                if(emoji == null){
                    emoji = {name: emojis[unused_emoji_index % emojis.length]}
                    unused_emoji_index++;
                }
                console.log(emoji);

                var button = new ButtonBuilder()
                    .setCustomId(role.id.toString())
                    .setLabel(role.name)
                    .setEmoji(emoji)
                    .setStyle(ButtonStyle.Secondary);

                row.addComponents(button);
            }
            return row;
        } else if (this.type == "DROPDOWN"){
            const select = new StringSelectMenuBuilder()
                .setCustomId(this.id.toString())
                .setPlaceholder('Select a role');

            for(role of reactionRoles){
                var emoji = await role.getEmojiObject();
                if(emoji == null){
                    emoji = {name: emojis[unused_emoji_index % emojis.length]}
                    unused_emoji_index++;
                }
                console.log(emoji);

                var item = new StringSelectMenuOptionBuilder()
                    .setValue(role.id.toString())
                    .setLabel(role.name)
                    .setEmoji(emoji);

                select.addOptions(item);
            }

            const row = new ActionRowBuilder().addComponents(select);
            return row;
        }
        
    }

    return RoleMenu;
}