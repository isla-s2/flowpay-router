import dbConfig from "../db_config.js";
import Sequelize from "sequelize";

const sequelize = new Sequelize(
    dbConfig.DB, 
    dbConfig.USER,
    dbConfig.PASSWORD,
    {
        host:dbConfig.HOST,
        dialect: dbConfig.dialect,
        port: dbConfig.port,

        pool: {
            max: dbConfig.pool.max,
            min: dbConfig.pool.min,
            acquire: dbConfig.pool.acquire,
            idle: dbConfig.pool.idle
        }
    }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

import tm from "./team_model.js";
db.team = tm(sequelize, Sequelize);

import ag from "./agent_model.js";
db.agent = ag(sequelize, Sequelize);

import tk from "./ticket_model.js";
db.ticket = tk(sequelize, Sequelize);

db.team.hasMany(db.agent, {
  foreignKey: {
    name: 'team_id',
    allowNull: false,
  }
});
db.agent.belongsTo(db.team, {
  foreignKey: 'team_id',
});

db.team.hasMany(db.ticket, {
  foreignKey: 'team_id',
});
db.ticket.belongsTo(db.team, {
  foreignKey: 'team_id',
});

db.agent.hasMany(db.ticket, {
  foreignKey: 'agent_id',
});
db.ticket.belongsTo(db.agent, {
  foreignKey: 'agent_id',
});

export default db;