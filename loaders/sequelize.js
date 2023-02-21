import {sequelize} from "../models/index.js";

export default sequelize.sync({
    force: false
}).then(() => {
    console.log('🌸 BLOSSOM DB ON 🌸');
}).catch((err) => {
    console.error(err);
});