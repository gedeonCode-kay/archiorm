// models.js
import { ORM } from "./orm.js";  // import ES Module

function defineModels(db) {
  const User = new ORM(db, "users", ["id", "name", "email"]);
  const Post = new ORM(db, "posts", ["id", "title", "content", "userId"]);
  const Tag = new ORM(db, "tags", ["id", "name"]);
  const PostTag = new ORM(db, "post_tags", ["postId", "tagId"]);

  // Définition des relations
  User.hasMany(Post, "userId");
  Post.belongsTo(User, "userId");

  Post.manyToMany(Tag, "post_tags", "postId", "tagId");
  Tag.manyToMany(Post, "post_tags", "tagId", "postId");

  return { User, Post, Tag, PostTag };
}

async function migrate(models) {
  for (let model of Object.values(models)) {
    await model.migrate();
  }
}

// Export ES Module
export { defineModels, migrate };
