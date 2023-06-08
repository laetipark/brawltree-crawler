import loaders from "./loaders/index.js";

import scheduler from "./scheduler/index.js";

const main = async () => {
    await loaders();
}

main().then(() => {
    console.log('🌸 HELLO BLOSSOM 🌸');
    scheduler();
});