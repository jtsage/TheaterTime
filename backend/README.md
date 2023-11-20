# TheaterTime

## /backend folder

This contains the node/fastify server that powers the app.

### Utility Scripts

**util_reset_demo_data.js** : Reset demo data.  Requires server to be running

**util_run_daily_clean.js** : Run daily maintenance. This should be added to crontab.  Or you can use something like WebCron to hit `http://your-host/clean_up`