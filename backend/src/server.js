import app from './app.js';
import env from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

/**
 * Starts the PJ Study backend HTTP server and establishes background connections.
 */
async function startServer() {
  // If run with --check-only flag, validate config and exit cleanly
  if (process.argv.includes('--check-only')) {
    console.log('✓ Configuration validated successfully.');
    console.log(`✓ Port: ${env.port}`);
    console.log(`✓ Environment: ${env.nodeEnv}`);
    process.exit(0);
  }

  // Attempt non-blocking database connection check in development
  try {
    await connectDatabase();
  } catch (err) {
    console.warn(
      '⚠️ Notice: Could not connect to database immediately. Will continue starting HTTP server:',
      err.message
    );
  }

  const server = app.listen(env.port, () => {
    console.log(`===============================================`);
    console.log(`  PJ Study API Server running`);
    console.log(`  Environment : ${env.nodeEnv}`);
    console.log(`  Port        : ${env.port}`);
    console.log(`  Health Check: http://localhost:${env.port}/api/v1/health`);
    console.log(`===============================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `\n✕ Error: Port ${env.port} is already in use.\n` +
          `  Note for macOS users: Port 5000 is occupied by default by macOS AirPlay Receiver.\n` +
          `  To resolve:\n` +
          `   1. Set PORT=5001 in backend/.env and update frontend/.env (VITE_API_BASE_URL=http://localhost:5001/api/v1), OR\n` +
          `   2. Turn off AirPlay Receiver in macOS: System Settings > General > AirDrop & AirPlay > AirPlay Receiver (toggle off).\n`
      );
    } else {
      console.error('Server error:', err);
    }
    process.exit(1);
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      await disconnectDatabase();
      process.exit(0);
    });

    // Force shutdown after timeout if pending requests hang
    setTimeout(() => {
      console.error('Forcing shutdown after timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

startServer().catch((error) => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});
