import { sequelize } from './src/models/index.js';

const describe = (table) => `
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = '${table}'
  ORDER BY ordinal_position;
`;

async function inspect() {
    try {
        const [results] = await sequelize.query(describe('assignment_service'));
        console.log("Columns in assignment_service table:");
        console.log(results);

        const [results2] = await sequelize.query(describe('assignments'));
        console.log("Columns in assignments table:");
        console.log(results2);
    } catch (err) {
        console.error("Inspection failed:", err.message);
    } finally {
        await sequelize.close();
    }
}

inspect();
