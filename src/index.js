const app = require('./app');
const dotenv = require('dotenv');
const { write } = require('./services/security-events.service');

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  write('info', 'server_started', {
    port: Number(PORT),
    environment: process.env.NODE_ENV || 'development',
    timezone: 'America/Guayaquil',
  });
});
