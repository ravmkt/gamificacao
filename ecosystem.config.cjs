module.exports = {
  apps: [
    {
      name: 'webapp',
      script: 'npx',
      args: 'next dev --port 3000',
      env: { NODE_ENV: 'development', PORT: 3000 },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
    },
  ],
};
