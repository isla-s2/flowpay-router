import * as tickets from "./ticket_controller.js";
import * as agents from "./agent_controller.js";

import express from 'express';

export default app => {
  var router = express.Router();

  // Criar novo ticket
  router.post("/ticket/create", tickets.create);

  //Encerrar atendimento
  router.patch("/ticket/close/:id", tickets.close);

  // Retrieve all tickets
  router.get("/ticket", tickets.findAll);

  // Retrieve a single ticket with id
  router.get("/ticket/:id", tickets.findOne);

  // Retrieve all agents
  router.get("/agent", agents.findAll);

  // Retrieve a single agent with id
  router.get("/agent/:id", agents.findOne);

  app.use('/api', router);
};