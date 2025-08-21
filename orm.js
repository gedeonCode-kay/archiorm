// orm.js
import sqlite3pkg from "sqlite3";
const sqlite3 = sqlite3pkg.verbose();

import mysql from "mysql2";
import pgPkg from "pg";
const { Pool } = pgPkg;

class DBAdapter {
  constructor(type, config) {
    this.type = type;
    if (type === "sqlite") {
      this.db = new sqlite3.Database(config.filename || ":memory:");
    } else if (type === "mysql") {
      this.db = mysql.createPool(config);
    } else if (type === "postgres") {
      this.db = new Pool(config);
    }
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (this.type === "sqlite") {
        this.db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      } else {
        this.db.query(sql, params, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      }
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (this.type === "sqlite") {
        this.db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      } else {
        this.db.query(sql, params, (err, result) => {
          if (err) reject(err);
          else resolve(result.rows || result);
        });
      }
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (this.type === "sqlite") {
        this.db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      } else {
        this.db.query(sql, params, (err, result) => {
          if (err) reject(err);
          else resolve((result.rows || result)[0]);
        });
      }
    });
  }
}

class ORM {
  constructor(db, table, fields) {
    this.db = db;
    this.table = table;
    this.fields = fields;
    this.relations = {};
  }

  hasMany(model, foreignKey) {
    this.relations[model.table] = { type: "hasMany", model, foreignKey };
  }

  belongsTo(model, foreignKey) {
    this.relations[model.table] = { type: "belongsTo", model, foreignKey };
  }

  manyToMany(model, pivotTable, localKey, foreignKey) {
    this.relations[model.table] = {
      type: "manyToMany",
      model,
      pivotTable,
      localKey,
      foreignKey,
    };
  }

  async migrate() {
    const columns = this.fields
      .map(f => (f === "id" ? "id INTEGER PRIMARY KEY AUTOINCREMENT" : `${f} TEXT`))
      .join(",");
    await this.db.run(`CREATE TABLE IF NOT EXISTS ${this.table} (${columns})`);
  }

  async create(obj) {
    const keys = Object.keys(obj).join(",");
    const placeholders = Object.keys(obj).map(() => "?").join(",");
    const sql = `INSERT INTO ${this.table} (${keys}) VALUES (${placeholders})`;
    return await this.db.run(sql, Object.values(obj));
  }

  async all() {
    const sql = `SELECT * FROM ${this.table}`;
    const rows = await this.db.all(sql);
    return this._loadRelations(rows);
  }

  async find(id) {
    const sql = `SELECT * FROM ${this.table} WHERE id = ?`;
    const row = await this.db.get(sql, [id]);
    if (!row) return null;
    return (await this._loadRelations([row]))[0];
  }

  async update(id, obj) {
    const set = Object.keys(obj).map(k => `${k}=?`).join(",");
    const sql = `UPDATE ${this.table} SET ${set} WHERE id = ?`;
    return await this.db.run(sql, [...Object.values(obj), id]);
  }

  async delete(id) {
    const sql = `DELETE FROM ${this.table} WHERE id = ?`;
    return await this.db.run(sql, [id]);
  }

  async _loadRelations(rows) {
    for (let row of rows) {
      for (let rel in this.relations) {
        const { type, model, foreignKey, pivotTable, localKey } =
          this.relations[rel];

        if (type === "hasMany") {
          row[rel] = await this.db.all(
            `SELECT * FROM ${model.table} WHERE ${foreignKey} = ?`,
            [row.id]
          );
        }

        if (type === "belongsTo") {
          row[rel] = await this.db.get(
            `SELECT * FROM ${model.table} WHERE id = ?`,
            [row[foreignKey]]
          );
        }

        if (type === "manyToMany") {
          row[rel] = await this.db.all(
            `SELECT ${model.table}.* 
             FROM ${model.table}
             JOIN ${pivotTable} ON ${pivotTable}.${foreignKey} = ${model.table}.id
             WHERE ${pivotTable}.${localKey} = ?`,
            [row.id]
          );
        }
      }
    }
    return rows;
  }
}

// Export ES Modules
export { DBAdapter, ORM };
