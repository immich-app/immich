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

class WebSocketTaskResult {
  int taskPointer;
  String? taskProtocol;

  WebSocketTaskResult(this.taskPointer, this.taskProtocol);
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
  ClientCertData selectCertificate(ClientCertPrompt promptText);

  @async
  void removeCertificate();

  int getClientPointer();

  /// iOS only - creates a WebSocket task and waits for connection to be established.
  @async
  WebSocketTaskResult createWebSocketTask(String url, List<String>? protocols);

  void setRequestHeaders(Map<String, String> headers);
}
