// Test environment setup — set required env vars before any module imports
process.env.JWT_SECRET = "test-jwt-secret-minimum-32-characters-long-enough";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-minimum-32-chars-long";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
process.env.CRON_SECRET = "test-cron-secret";
