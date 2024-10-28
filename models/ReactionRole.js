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
