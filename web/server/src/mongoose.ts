import * as mongoose from 'mongoose';
import {env} from "./env.ts";

(async () => {
  await mongoose.connect(env('MONGODB_URI'), { dbName: env('MONGODB_DB_NAME') });
})();