//import dotenv from 'dotenv';
//dotenv.config();

import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({ message: "Router FlowPay" });
});

import rt from "./src/routes.js";
rt(app);

export { app }