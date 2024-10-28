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
            // don't save more than 25 reaction roles to one menu if the menu's type is button
            checkMenuLimit() {
                if(this.type == 'BUTTON'){
                    allRoles = this.getReaction_roles();
                    if(allRoles.length >= 25){
                        throw new Error(`The maximum number of reaction roles that can be assigned to a button menu is 25.`)
                    }
                }
            }
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
            const rows = [];
            var currentRow = new ActionRowBuilder();
            for(role of reactionRoles){
                var emoji = await role.getEmojiObject();
                if(emoji == null){
                    emoji = {name: emojis[unused_emoji_index % emojis.length]}
                    unused_emoji_index++;
                }

                var button = new ButtonBuilder()
                    .setCustomId(role.id.toString())
                    .setLabel(role.name)
                    .setEmoji(emoji)
                    .setStyle(ButtonStyle.Secondary);

                // the hard limit for components is 5 rows of 5 each
                if(currentRow.components.length >= 5){
                    rows.push(currentRow);
                    currentRow = new ActionRowBuilder();
                }

                if(rows.length < 5){
                    currentRow.addComponents(button);
                }
            }
            if(currentRow.components.length > 0 && rows.length < 6){
                rows.push(currentRow)
            }
            console.log(currentRow);
            return rows;
        } else if (this.type == "DROPDOWN"){
            const select = new StringSelectMenuBuilder()
                .setCustomId(this.id.toString())
                .setPlaceholder('Select a role');

            var item = new StringSelectMenuOptionBuilder()
                .setValue("remove_all")
                .setLabel("None")
                .setEmoji({name: '❌'});

            select.addOptions(item);

            for(role of reactionRoles){
                var emoji = await role.getEmojiObject();
                if(emoji == null){
                    emoji = {name: emojis[unused_emoji_index % emojis.length]}
                    unused_emoji_index++;
                }

                item = new StringSelectMenuOptionBuilder()
                    .setValue(role.id.toString())
                    .setLabel(role.name)
                    .setEmoji(emoji);

                select.addOptions(item);
            }

            const row = new ActionRowBuilder().addComponents(select);
            return [row];
        }
        
    }

    return RoleMenu;
}