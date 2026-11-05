import 'package:pigeon/pigeon.dart';

class ClientCertData {
  Uint8List data;
  String password;

  ClientCertData(this.data, this.password);
}

class ClientCertPrompt {
  String title;
  String message;
  String cancel;
  String confirm;

  ClientCertPrompt(this.title, this.message, this.cancel, this.confirm);
}

/// Result of a streaming upload performed natively.
class StreamingUploadResult {
  bool isSuccess;
  int statusCode;
  String? body;
  String? errorMessage;

    /// How many body bytes actually reached the wire before the request ended.
    ///
    /// The Dart side uses this to decide whether a failed transfer may be resent:
    /// once bytes are on the wire the server may already have written part of the
    /// asset, so a resend could duplicate it. Progress callbacks cannot be used --
    /// they are optional, so a caller that does not subscribe sees zero bytes
    /// regardless of what was sent.
  int bytesSent;

  StreamingUploadResult(this.isSuccess, this.statusCode, this.body, this.errorMessage, this.bytesSent);
}

/// Reports upload progress from the native streaming upload back to Dart.
@FlutterApi()
abstract class StreamingUploadProgressApi {
  /// [progressKey] identifies which upload this belongs to, so concurrent
  /// uploads do not overwrite each other's progress.
  void onProgress(String progressKey, int transferred, int total);
}

@ConfigurePigeon(
  PigeonOptions(
    dartOut: 'lib/platform/network_api.g.dart',
    swiftOut: 'ios/Runner/Core/Network.g.swift',
    swiftOptions: SwiftOptions(includeErrorClass: false),
    kotlinOut:
        'android/app/src/main/kotlin/app/alextran/immich/core/Network.g.kt',
    kotlinOptions: KotlinOptions(package: 'app.alextran.immich.core', includeErrorClass: true),
    dartOptions: DartOptions(),
    dartPackageName: 'immich_mobile',
  ),
)
@HostApi()
abstract class NetworkApi {
  @async
  void addCertificate(ClientCertData clientData);

  @async
  void selectCertificate(ClientCertPrompt promptText);

  @async
  void removeCertificate();

  bool hasCertificate();

  int getClientPointer();

  void setRequestHeaders(Map<String, String> headers, List<String> serverUrls, String? token);

  void clearCookies();

  String getAppGroupId();

  Map<String, String> requestAuthHeaders(String url);

  String getCronetUserAgent();

  String getCronetStoragePath();

  /// Uploads a single file as `multipart/form-data` from native code, streaming
  /// it off disk rather than buffering the whole payload in memory.
  ///
  /// `package:cronet_http` calls `stream.toBytes()` before handing the body to
  /// Cronet, so any payload larger than the heap kills the process. Small uploads
  /// stay on the regular Dart client.
  ///
  /// Returns the raw response body on 2xx, and a result describing the failure
  /// otherwise. Progress is reported through [StreamingUploadProgressApi].
  @async
  StreamingUploadResult uploadFileStreaming(
    String url,
    String filePath,
    String fileName,
    String fileFieldName,
    String? mimeType,
    Map<String, String> fields,
    String progressKey,
  );

  /// Asks the native side to abort an in-flight streaming upload. Safe to call
  /// for a key that is not uploading.
  void cancelStreamingUpload(String progressKey);
}
