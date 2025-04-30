const int noDbId = -9223372036854775808; // from Isar
const double downloadCompleted = -1;
const double downloadFailed = -2;

// Number of log entries to retain on app start
const int kLogTruncateLimit = 250;

// Sync
const int kSyncEventBatchSize = 5000;

// Hash batch limits
const int kBatchHashFileLimit = 128;
const int kBatchHashSizeLimit = 1024 * 1024 * 1024; // 1GB
