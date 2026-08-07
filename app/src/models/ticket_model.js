export default (sequelize, Sequelize) => {
    const Ticket = sequelize.define("ticket", {
        ticket_ref: {type: Sequelize.INTEGER},
        subject: {type: Sequelize.STRING}
    });

    return Ticket;
}