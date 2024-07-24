import 'dart:io';

import 'package:immich_mobile/widgets/common/transparent_image.dart';
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
    when(() => request.close())
        .thenAnswer((_) => Future<HttpClientResponse>.value(response));

    // Response mocks
    when(() => response.statusCode).thenReturn(HttpStatus.ok);
    when(() => response.compressionState)
        .thenReturn(HttpClientResponseCompressionState.decompressed);
    when(() => response.contentLength)
        .thenAnswer((_) => kTransparentImage.length);
    when(
      () => response.listen(
        captureAny(),
        cancelOnError: captureAny(named: 'cancelOnError'),
        onDone: captureAny(named: 'onDone'),
        onError: captureAny(named: 'onError'),
      ),
    ).thenAnswer((invocation) {
      final onData =
          invocation.positionalArguments[0] as void Function(List<int>);

      final onDone = invocation.namedArguments[#onDone] as void Function();

      final onError = invocation.namedArguments[#onError] as void
          Function(Object, [StackTrace]);

      final cancelOnError = invocation.namedArguments[#cancelOnError] as bool;

      return Stream<List<int>>.fromIterable([kTransparentImage.toList()])
          .listen(
        onData,
        onDone: onDone,
        onError: onError,
        cancelOnError: cancelOnError,
      );
    });

    return client;
  }
}

class _MockHttpClient extends Mock implements HttpClient {}

class _MockHttpClientRequest extends Mock implements HttpClientRequest {}

class _MockHttpClientResponse extends Mock implements HttpClientResponse {}

class _MockHttpHeaders extends Mock implements HttpHeaders {}
