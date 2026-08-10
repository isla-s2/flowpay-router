export default (sequelize, Sequelize) => {
    const Team = sequelize.define("team", {
        name: {type: Sequelize.STRING, allowNull: false}
    },
    {timestamps: false,}
    );

    return Team;
}