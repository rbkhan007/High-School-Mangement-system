import { RunOptions } from 'pm2';

const config: { apps: RunOptions[] } = {
    apps: [{
        name: 'basudevpur-school-backend',
        script: 'packages/backend/dist/server.js', // Production entry (compiled from src/server.ts)
        instances: 'max',
        exec_mode: 'cluster',
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000,
            DB_PORT: 6432 // Connect via PgBouncer
        }
    }]
};

export default config;
