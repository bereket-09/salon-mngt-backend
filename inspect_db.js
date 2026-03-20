import { sequelize } from './src/models/index.js';

async function inspect() {
    try {
        const [results] = await sequelize.query("DESCRIBE assignment_service");
        console.log("Columns in assignment_service table:");
        console.log(results);

        const [results2] = await sequelize.query("DESCRIBE assignments");
        console.log("Columns in assignments table:");
        console.log(results2);
    } catch (err) {
        console.error("Inspection failed:", err.message);
    } finally {
        await sequelize.close();
    }
}

inspect();
