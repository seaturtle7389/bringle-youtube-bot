module.exports = function(sequelize, DataTypes){
    const ReactionRole =  sequelize.define('reaction_role', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        role_id: {
            type: DataTypes.STRING,
            required: true,
            unique: true
        },

        emoji_id: {
            type: DataTypes.STRING
        },

        name: {
            type: DataTypes.STRING,
            required: true
        }
        
    }, 
    {   underscored: true, 
        timestamps: true, 
        validate: {
            // don't save more than 25 reaction roles to one menu if the menu's type is button
            checkMenuLimit() {
                var roleMenu = this.getRole_menu();
                if(roleMenu.type == 'BUTTON'){
                    allRoles = roleMenu.getReaction_roles();
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

    //
    // instance methods
    //
    ReactionRole.prototype.getEmojiObject = async function(){
        if(this.emoji_id == null){
            return null;
        } else if(this.emoji_id.length > 10) {
            return this.emoji_id;
        } else {
            return { name: this.emoji_id }
        }
    }
    

    return ReactionRole;
}
