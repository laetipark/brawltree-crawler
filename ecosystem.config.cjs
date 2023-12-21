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
  ],
};
