import path from 'node:path';
import { v4 as uuid } from 'uuid';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import NodeEnvironment from 'jest-environment-node';
import type { JestEnvironmentConfig, EnvironmentContext } from '@jest/environment';

class CustomEnvironment extends NodeEnvironment {

    originEnv?: NodeJS.ProcessEnv;
    mongodb?: MongoMemoryServer;
    rootDir: string;
    count = 0;

    constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
        super(config, context);
        const { projectConfig: { rootDir } } = config;
        this.rootDir = rootDir;
    }

    override async setup() {
        await super.setup();
        const dbName = uuid();
        ['.env', '.env.local', '.env.test', '.env.test.local'].forEach(env => dotenv.config({ path: path.join(this.rootDir, env), override: true }));
        this.originEnv = process.env;
        this.mongodb = await MongoMemoryServer.create({ instance: { dbName } });
        const mongoUri = this.mongodb.getUri();
        this.global.process.env = {
            ...this.originEnv,
            KLAVE_EXPRESS_SESSION_SECRETS: 'secret-test-1337',
            KLAVE_MONGODB_URL: mongoUri,
            KLAVE_MONGODB_DBNAME: dbName
        };
    }

    override async teardown() {
        await this.mongodb?.stop() || Promise.resolve();
        if (this.originEnv)
            this.global.process.env = this.originEnv;
        await super.teardown();
    }

}

module.exports = CustomEnvironment;
