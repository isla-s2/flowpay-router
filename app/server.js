//import dotenv from 'dotenv';
//dotenv.config();

import { app } from "./app.js";
import db from "./src/models/index.js";

db.sequelize.sync()
    .then(() => {console.log("Synced database");})
    .catch((err) => {console.log("Failed to sync database: " + err);});

/* db.sequelize.sync({ force: true }).then(() => {
  console.log("Drop and re-sync db.");
}); */

const PORT = process.env.NODE_DOCKER_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is listening at http://localhost:${PORT}`);
});