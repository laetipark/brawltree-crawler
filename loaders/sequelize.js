import db from "../models/index.js";

export default () =>
  db.sequelize
    .sync({
      force: false,
    })
    .then(() => {
      console.log(`🌸 | Brawl Tree Database ON, ${new Date()}`);
    })
    .catch((err) => {
      console.error(err);
    });