import * as tickets from "./ticket_controller.js";
import * as agents from "./agent_controller.js";

import express from 'express';

export default app => {
  var router = express.Router();

  // Create a new ticket
  router.post("/ticket", tickets.create);

  // Retrieve all tickets
  router.get("/ticket", tickets.findAll);

  // Retrieve a single ticket with id
  router.get("/ticket/:id", tickets.findOne);

  // Retrieve all tickets
  router.get("/agent", agents.findAll);

  // Retrieve a single ticket with id
  router.get("/agent/:id", agents.findOne);

  app.use('/api', router);
};