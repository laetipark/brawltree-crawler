module.exports = {
  apps: [
    {
      name: 'brawltree-product',
      script: 'node',
      args: 'dist/main.js',
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'brawltree-worker',
      script: 'node',
      args: 'dist/worker.js',
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'brawltree-scheduler',
      script: 'node',
      args: 'dist/scheduler.js',
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
