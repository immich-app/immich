import 'dart:io';

const String kMobileMetadataKey = "mobile-app";

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
const String kBackupEditPairGroup = 'backup_edit_pair_group';

// Upload multipart 'visibility' value for motion videos (server AssetVisibility.Hidden)
// so they never flash onto the timeline before their still links them.
const String kHiddenVisibility = 'hidden';

// Server's 400 message when stackParentId points at a trashed/deleted asset
// (asset-media.service.ts). Matching it clears the stale prior stamps so the
// next backup cycle re-resolves instead of looping on the same dead id.
const String kDeadStackParentError = 'Cannot stack onto a trashed or missing asset';

// Multipart fields that stack a burst frame under its representative without
// letting it steal the cover (server keepPrimary, asset-media.service.ts).
// Empty when there's no anchor yet (rep-less group → standalone upload).
Map<String, String> burstStackFields(String? anchorRemoteId) =>
    anchorRemoteId != null ? {'stackParentId': anchorRemoteId, 'keepPrimary': 'true'} : const {};
const String kDownloadGroupImage = 'group_image';
const String kDownloadGroupVideo = 'group_video';
const String kDownloadGroupLivePhoto = 'group_livephoto';
const String kShareDownloadGroup = 'group_share';

// Timeline constants
const int kTimelineNoneSegmentSize = 120;
const int kTimelineAssetLoadBatchSize = 1024;
const int kTimelineAssetLoadOppositeSize = 64;

// Widget keys
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

const int kMinMonthsToEnableScrubberSnap = 12;

const String kImmichAppStoreLink = "https://apps.apple.com/app/immich/id1613945652";
const String kImmichPlayStoreLink = "https://play.google.com/store/apps/details?id=app.alextran.immich";
const String kImmichLatestRelease = "https://github.com/immich-app/immich/releases/latest";

const int kPhotoTabIndex = 0;
const int kSearchTabIndex = 1;
const int kAlbumTabIndex = 2;
const int kLibraryTabIndex = 3;

// Workaround for SQLite's variable limit (SQLITE_MAX_VARIABLE_NUMBER = 32766)
const int kDriftMaxChunk = 32000;
