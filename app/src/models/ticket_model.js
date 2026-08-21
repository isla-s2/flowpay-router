export default (sequelize, Sequelize) => {
    const Ticket = sequelize.define("ticket", {
        ticket_ref: {type: Sequelize.INTEGER, allowNull: false},
        subject: {type: Sequelize.STRING, allowNull: false},
        cur_status: {type: Sequelize.STRING, allowNull: false, validate: {isIn: [['in queue', 'rejected', 'assigned', 'closed']]}},
        moment: {
            type: 'TIMESTAMP(6)',
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP(6)'),
            allowNull: false
        }
    },
    {timestamps: false, version: true}
    );

    return Ticket;
}