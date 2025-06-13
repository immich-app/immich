const int noDbId = -9223372036854775808; // from Isar
const double downloadCompleted = -1;
const double downloadFailed = -2;

// Number of log entries to retain on app start
const int kLogTruncateLimit = 250;

// Sync
const int kSyncEventBatchSize = 5000;
const int kFetchLocalAssetsBatchSize = 40000;

// Hash batch limits
const int kBatchHashFileLimit = 128;
const int kBatchHashSizeLimit = 1024 * 1024 * 1024; // 1GB

// Secure storage keys
const String kSecuredPinCode = "secured_pin_code";

// Timeline constants
const int kTimelineNoneSegmentSize = 120;
const int kTimelineAssetLoadBatchSize = 256;
const int kTimelineAssetLoadOppositeSize = 64;

// Widget keys
const String kWidgetAuthToken = "widget_auth_token";
const String kWidgetServerEndpoint = "widget_server_url";
const String appShareGroupId = "group.app.immich.share";
