//import dotenv from 'dotenv';
//dotenv.config();

import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import db from "./src/models/index.js";
db.sequelize.sync()
    .then(() => {console.log("Synced database");})
    .catch((err) => {console.log("Failed to sync database: " + err);});

db.sequelize.sync({ force: true }).then(() => {
  console.log("Drop and re-sync db.");
});

app.get('/', (req, res) => {
    res.json({ message: "Router FlowPay" });
});

import rt from "./src/routes.js";
rt(app);

const PORT = process.env.NODE_DOCKER_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is listening at http://localhost:${PORT}`);
});