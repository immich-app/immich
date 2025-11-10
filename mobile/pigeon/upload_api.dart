import 'package:pigeon/pigeon.dart';

enum UploadApiErrorCode {
  unknown("An unknown error occurred"),
  assetNotFound("Asset not found"),
  fileNotFound("File not found"),
  resourceNotFound("Resource not found"),
  invalidResource("Invalid resource"),
  encodingFailed("Encoding failed"),
  writeFailed("Write failed"),
  notEnoughSpace("Not enough space"),
  networkError("Network error"),
  photosInternalError("Apple Photos internal error"),
  photosUnknownError("Apple Photos unknown error"),
  noServerUrl("Server URL is not set"),
  noDeviceId("Device ID is not set"),
  noAccessToken("Access token is not set"),
  interrupted("Upload interrupted"),
  cancelled("Upload cancelled"),
  downloadStalled("Download stalled"),
  forceQuit("App was force quit"),
  outOfResources("Out of resources"),
  backgroundUpdatesDisabled("Background updates are disabled"),
  uploadTimeout("Upload timed out"),
  iCloudRateLimit("iCloud rate limit reached"),
  iCloudThrottled("iCloud requests are being throttled");

  final String message;

  const UploadApiErrorCode(this.message);
}

enum UploadApiStatus {
  downloadPending,
  downloadQueued,
  downloadFailed,
  uploadPending,
  uploadQueued,
  uploadFailed,
  uploadComplete,
  uploadSkipped,
}

class UploadApiTaskStatus {
  final String id;
  final String filename;
  final UploadApiStatus status;
  final UploadApiErrorCode? errorCode;
  final int? httpStatusCode;

  const UploadApiTaskStatus(this.id, this.filename, this.status, this.errorCode, this.httpStatusCode);
}

class UploadApiTaskProgress {
  final String id;
  final double progress;
  final double? speed;
  final int? totalBytes;

  const UploadApiTaskProgress(this.id, this.progress, this.speed, this.totalBytes);
}

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/upload_api.g.dart',
    swiftOut: 'ios/Runner/Upload/UploadTask.g.swift',
    swiftOptions: SwiftOptions(includeErrorClass: false),
    kotlinOut: 'android/app/src/main/kotlin/app/alextran/immich/upload/UploadTask.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.upload'),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
@HostApi()
abstract class UploadApi {
  @async
  void initialize();

  @async
  void refresh();

  @async
  void cancelAll();

  @async
  void enqueueAssets(List<String> localIds);

  @async
  void enqueueFiles(List<String> paths);
}

@EventChannelApi()
abstract class UploadFlutterApi {
  UploadApiTaskStatus streamStatus();

  UploadApiTaskProgress streamProgress();
}
