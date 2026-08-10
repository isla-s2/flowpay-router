export default (sequelize, Sequelize) => {
    const Agent = sequelize.define("agent", {
        occupied_slots: {type: Sequelize.INTEGER, allowNull: false, validate: {min: 0, max: 3}}
    },
    {timestamps: false,}
    );

    return Agent;
}