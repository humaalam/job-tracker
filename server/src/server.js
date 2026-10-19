// Import config first so .env is loaded before any other module runs.
import { config } from './config/env.js';
import { app } from './app.js';

app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port} (${config.nodeEnv})`);
});
