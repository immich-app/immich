import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/services/immich_logger.service.dart';

void main() {
  test('shared logs hide server addresses, tokens and emails', () {
    const lines = [
      'Resuming session at https://immich.example.com/api',
      'NSErrorClientException: ... pretending to be “immich.example.com” ... [code=-1202], uri=https://immich.example.com',
      'ClientException: java.net.ConnectException: Failed to connect to immich.example.com/192.168.1.5:2283',
      'Hostname immich.example.com not verified:\n    DN: CN=immich.example.com\n    subjectAltNames: [immich.example.com]',
      'SocketException: HTTP connection timed out after 0:00:10.000000, host: old-server.lan, port: 2283',
      "SocketException: Failed host lookup: 'old-server.lan' (OS Error: no address, errno = 8)",
      'SocketException: Connection refused (OS Error: Connection refused, errno = 61), address = 10.0.0.9, port = 52341',
      'Received OAuth callback: app.immich:///oauth-callback?code=abc123&state=xyz',
      'Finished OAuth login with response: someone@example.com',
      'Failed to update auth info with access token: old-token-456',
      'Bearer secret-token-123 sent',
      'SqliteException(1555): constraint failed\n  Causing statement: INSERT INTO "auth_user_entity", parameters: a, pin-hash-789',
      'ClientException: java.net.ConnectException: Failed to connect to gone.example.net/10.0.0.7:2283, uri=https://gone.example.net/api',
      'Retrying gone.example.net',
    ];
    final hidden = ImmichLogger.sensitive([
      'https://Immich.Example.com/api',
      'immich.example.com',
      'secret-token-123',
      'short',
    ], lines);
    final leak = RegExp(
      r'example\.(com|net)|old-server|192\.168|10\.0\.0|abc123|someone@|old-token|secret-token|pin-hash',
    );
    for (final line in lines) {
      expect(line.replaceAll(hidden, '<redacted>'), isNot(contains(leak)), reason: line);
    }
    expect('Uploaded 12 assets in 3.2s, short'.replaceAll(hidden, '<redacted>'), 'Uploaded 12 assets in 3.2s, short');
  });
}
