import expressLoader from "./express.js";
import sequelizeLoader from "./sequelize.js";

export default async () => {
    await expressLoader();
    await sequelizeLoader;
}
