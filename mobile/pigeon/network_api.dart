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

/// 原生流式上传的结果。
class StreamingUploadResult {
  bool isSuccess;
  int statusCode;
  String? body;
  String? errorMessage;

    /// 请求结束前真正发出去多少 body 字节。
    ///
    /// Dart 侧靠它判断失败的传输能不能重发：字节在路上时服务器可能写了一部分，
    /// 重发会变重复。不能用进度回调判断，那是可选的，
    /// 不订阅的调用方看到的永远是 0。
  int bytesSent;

  StreamingUploadResult(this.isSuccess, this.statusCode, this.body, this.errorMessage, this.bytesSent);
}

/// 把原生流式上传的进度报回 Dart。
@FlutterApi()
abstract class StreamingUploadProgressApi {
  /// [progressKey] 标明属于哪次上传，并发时不会互相覆盖。
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

  /// 由原生代码以 multipart/form-data 上传文件，从磁盘流式读。
  /// cronet_http 会缓冲整个 body，大文件会直接被杀。进度走 [StreamingUploadProgressApi]。
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

  /// key 当前不在上传时调用也安全。
  void cancelStreamingUpload(String progressKey);
}
