import 'dart:io';
import 'dart:typed_data';

import 'package:mocktail/mocktail.dart';

/// Mocks the http client to always return a transparent image for all the requests. Only useful in widget
/// tests to return network images
class MockHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    final client = _MockHttpClient();
    final request = _MockHttpClientRequest();
    final response = _MockHttpClientResponse();
    final headers = _MockHttpHeaders();

    // Client mocks
    when(() => client.autoUncompress).thenReturn(true);

    // Request mocks
    when(() => request.headers).thenAnswer((_) => headers);
    when(() => request.close()).thenAnswer((_) => Future<HttpClientResponse>.value(response));

    // Response mocks
    when(() => response.statusCode).thenReturn(HttpStatus.ok);
    when(() => response.compressionState).thenReturn(HttpClientResponseCompressionState.decompressed);
    when(() => response.contentLength).thenAnswer((_) => _kTransparentImage.length);
    when(
      () => response.listen(
        captureAny(),
        cancelOnError: captureAny(named: 'cancelOnError'),
        onDone: captureAny(named: 'onDone'),
        onError: captureAny(named: 'onError'),
      ),
    ).thenAnswer((invocation) {
      final onData = invocation.positionalArguments[0] as void Function(List<int>);

      final onDone = invocation.namedArguments[#onDone] as void Function();

      final onError = invocation.namedArguments[#onError] as void Function(Object, [StackTrace]);

      final cancelOnError = invocation.namedArguments[#cancelOnError] as bool;

      return Stream<List<int>>.fromIterable([
        _kTransparentImage.toList(),
      ]).listen(onData, onDone: onDone, onError: onError, cancelOnError: cancelOnError);
    });

    return client;
  }
}

class _MockHttpClient extends Mock implements HttpClient {}

class _MockHttpClientRequest extends Mock implements HttpClientRequest {}

class _MockHttpClientResponse extends Mock implements HttpClientResponse {}

class _MockHttpHeaders extends Mock implements HttpHeaders {}

final Uint8List _kTransparentImage = Uint8List.fromList(<int>[
  0x89,
  0x50,
  0x4E,
  0x47,
  0x0D,
  0x0A,
  0x1A,
  0x0A,
  0x00,
  0x00,
  0x00,
  0x0D,
  0x49,
  0x48,
  0x44,
  0x52,
  0x00,
  0x00,
  0x00,
  0x01,
  0x00,
  0x00,
  0x00,
  0x01,
  0x08,
  0x06,
  0x00,
  0x00,
  0x00,
  0x1F,
  0x15,
  0xC4,
  0x89,
  0x00,
  0x00,
  0x00,
  0x0A,
  0x49,
  0x44,
  0x41,
  0x54,
  0x78,
  0x9C,
  0x63,
  0x00,
  0x01,
  0x00,
  0x00,
  0x05,
  0x00,
  0x01,
  0x0D,
  0x0A,
  0x2D,
  0xB4,
  0x00,
  0x00,
  0x00,
  0x00,
  0x49,
  0x45,
  0x4E,
  0x44,
  0xAE,
]);
