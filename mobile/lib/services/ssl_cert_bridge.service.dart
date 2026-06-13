import 'package:flutter/services.dart';

class SslCertBridge {
  static const _channel = MethodChannel('app.immich/ssl_cert');

  static Future<String?> getPendingCertFingerprint() async {
    return await _channel.invokeMethod<String>('getPendingCertFingerprint');
  }

  static Future<String?> getPendingCertSubject() async {
    return await _channel.invokeMethod<String>('getPendingCertSubject');
  }

  static Future<String?> getPendingCertIssuer() async {
    return await _channel.invokeMethod<String>('getPendingCertIssuer');
  }

  static Future<void> acceptPendingCert() async {
    await _channel.invokeMethod<void>('acceptPendingCert');
  }

  static Future<void> rejectPendingCert() async {
    await _channel.invokeMethod<void>('rejectPendingCert');
  }

  static Future<bool> isCertAccepted(String fingerprint) async {
    final result = await _channel.invokeMethod<bool>('isCertAccepted', fingerprint);
    return result ?? false;
  }
}
