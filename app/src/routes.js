import * as tickets from "./ticket_controller.js";

import express from 'express';

export default app => {
  var router = express.Router();

  // Create a new ticket
  router.post("/ticket", tickets.create);

  // Retrieve all tickets
  router.get("/", tickets.findAll);

  // Retrieve a single ticket with id
  router.get("/:id", tickets.findOne);

  app.use('/api', router);
};