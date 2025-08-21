// app.js
import express from "express";
import { DBAdapter } from "./orm.js";
import { defineModels, migrate } from "./models.js";

const app = express();
app.use(express.json());

const db = new DBAdapter("sqlite", { filename: "./data.db" });
// const db = new DBAdapter("mysql", { host:"localhost", user:"root", password:"pass", database:"testdb" });
// const db = new DBAdapter("postgres", { user:"postgres", host:"localhost", database:"testdb", password:"pass", port:5432 });

const models = defineModels(db);

(async () => {
  await migrate(models);
})();

const { User, Post, Tag } = models;

app.post("/users", async (req, res) => res.json(await User.create(req.body)));
app.get("/users", async (req, res) => res.json(await User.all()));
app.get("/users/:id", async (req, res) => res.json(await User.find(req.params.id)));

app.post("/posts", async (req, res) => res.json(await Post.create(req.body)));
app.get("/posts/:id", async (req, res) => res.json(await Post.find(req.params.id)));

app.post("/tags", async (req, res) => res.json(await Tag.create(req.body)));
app.get("/tags", async (req, res) => res.json(await Tag.all()));

app.listen(3000, () => console.log("Serveur ORM sur http://localhost:3000"));
