## 1️⃣ Installer ton package

Dans ton projet Node.js, installe ton ORM depuis npm :

``npm install archiorm``

## 2️⃣ Importer ton ORM

Dans ton fichier principal (ex. app.js) :

```// Importer ton ORM depuis npm```
```const { DBAdapter, ORM } = require("archiorm");```

```// Adapter DB```
```const db = new DBAdapter("sqlite", { filename: "./data.db" });```
```// ou MySQL / PostgreSQL```
```// const db = new DBAdapter("mysql", { host:"localhost", user:"root", password:"pass", database:"testdb" });```
```// const db = new DBAdapter("postgres", { user:"postgres", host:"localhost", database:"testdb", password:"pass", port:5432 });```


## 3️⃣ Définir les modèles

Crée un fichier models.js dans ton projet :

```const { ORM } = require("archiorm");```

```const User = new ORM(db, "users", ["id", "name", "email"]);```
```const Post = new ORM(db, "posts", ["id", "title", "content", "userId"]);```
```const Tag  = new ORM(db, "tags", ["id", "name"]);```
```const PostTag = new ORM(db, "post_tags", ["postId", "tagId"]);```

```// Relations```
```User.hasMany(Post, "userId");```
```Post.belongsTo(User, "userId");```

```Post.manyToMany(Tag, "post_tags", "postId", "tagId");```
```Tag.manyToMany(Post, "post_tags", "tagId", "postId");```

```module.exports = { User, Post, Tag, PostTag };```

## 4️⃣ Migrer les tables

Au lancement de ton application, crée les tables automatiquement :

```const models = require("./models");```

``(async () => {``
  ```for (let model of Object.values(models)) {```
    ```await model.migrate();```
``  }``
```})();```

## 5️⃣ Utiliser les modèles

Chaque modèle fournit des méthodes CRUD :

Méthode	Description
create(data)	Crée une ligne
all()	Récupère toutes les lignes (avec relations)
find(id)	Récupère un élément par ID (avec relations)
update(id, data)	Met à jour un enregistrement
delete(id)	Supprime un enregistrement

```const express = require("express");```
```const { User, Post, Tag } = require("./models");```

```const app = express();```
```app.use(express.json());```

```app.post("/users", async (req, res) => res.json(await User.create(req.body)));```
```app.get("/users", async (req, res) => res.json(await User.all()));```
```app.get("/users/:id", async (req, res) => res.json(await User.find(req.params.id)));```

```app.listen(3000, () => console.log("Serveur sur http://localhost:3000"));```


## #️⃣ Ajouter de nouveaux modèles

Déclare un nouveau modèle avec ORM dans models.js.

Définis ses relations (hasMany, belongsTo, manyToMany).

Les migrations automatiques créeront la table lors du lancement.



# Définis ses relations (hasMany, belongsTo, manyToMany).

## 1️⃣ hasMany (1 → N)

Signification : un enregistrement d’un modèle peut avoir plusieurs enregistrements associés dans un autre modèle.

Exemple : un User a plusieurs Post.

```User.hasMany(Post, "userId");```

User : modèle principal

Post : modèle associé

"userId" : clé étrangère dans Post qui référence User.id

### Ce que ça fait :
Quand tu récupères un utilisateur avec User.find(id) ou User.all(), le champ posts (nom du modèle associé par défaut) contiendra tous les posts de cet utilisateur.


## 2️⃣ belongsTo (N → 1)

Signification : un enregistrement appartient à un autre modèle.

Exemple : un Post appartient à un User.
```Post.belongsTo(User, "userId");```

Post : modèle enfant

User : modèle parent

"userId" : clé étrangère dans Post

### Ce que ça fait :
Quand tu récupères un post avec Post.find(id), le champ user contiendra l’utilisateur associé.

## 3️⃣ manyToMany (N ↔ N)

Signification : plusieurs enregistrements d’un modèle peuvent être liés à plusieurs enregistrements d’un autre modèle via une table pivot.

Exemple : un Post peut avoir plusieurs Tag, et un Tag peut appartenir à plusieurs Post. On utilise la table pivot post_tags.

```Post.manyToMany(Tag, "post_tags", "postId", "tagId");```
```Tag.manyToMany(Post, "post_tags", "tagId", "postId");```

Post ↔ Tag : modèles liés

"post_tags" : nom de la table pivot

"postId" : clé locale dans la table pivot pour Post

"tagId" : clé étrangère dans la table pivot pour Tag

### Ce que ça fait :
Quand tu récupères un post avec Post.find(id), le champ tags contiendra tous les tags liés via la table pivot.
Quand tu récupères un tag avec Tag.find(id), le champ posts contiendra tous les posts associés.
