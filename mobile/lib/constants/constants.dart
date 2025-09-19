import 'dart:io';

const int noDbId = -9223372036854775808; // from Isar
const double downloadCompleted = -1;
const double downloadFailed = -2;

// Number of log entries to retain on app start
const int kLogTruncateLimit = 2000;

// Sync
const int kSyncEventBatchSize = 5000;
const int kFetchLocalAssetsBatchSize = 40000;

// Hash batch limits
final int kBatchHashFileLimit = Platform.isIOS ? 32 : 512;
const int kBatchHashSizeLimit = 1024 * 1024 * 1024; // 1GB

// Secure storage keys
const String kSecuredPinCode = "secured_pin_code";

// background_downloader task groups
const String kManualUploadGroup = 'manual_upload_group';
const String kBackupGroup = 'backup_group';
const String kBackupLivePhotoGroup = 'backup_live_photo_group';
const String kDownloadGroupImage = 'group_image';
const String kDownloadGroupVideo = 'group_video';
const String kDownloadGroupLivePhoto = 'group_livephoto';

// Timeline constants
const int kTimelineNoneSegmentSize = 120;
const int kTimelineAssetLoadBatchSize = 1024;
const int kTimelineAssetLoadOppositeSize = 64;

// Widget keys
const String appShareGroupId = "group.app.immich.share";
const String kWidgetAuthToken = "widget_auth_token";
const String kWidgetServerEndpoint = "widget_server_url";
const String kWidgetCustomHeaders = "widget_custom_headers";

// add widget identifiers here for new widgets
// these are used to force a widget refresh
// (iOSName, androidFQDN)
const List<(String, String)> kWidgetNames = [
  ('com.immich.widget.random', 'app.alextran.immich.widget.RandomReceiver'),
  ('com.immich.widget.memory', 'app.alextran.immich.widget.MemoryReceiver'),
];

const double kUploadStatusFailed = -1.0;
const double kUploadStatusCanceled = -2.0;

const int kMinMonthsToEnableScrubberSnap = 12;
