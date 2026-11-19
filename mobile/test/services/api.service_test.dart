import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart';
import 'package:http/testing.dart';
import 'package:immich_mobile/infrastructure/repositories/network.repository.dart';
import 'package:immich_mobile/services/api.service.dart';

void main() {
  List<Uri> redirect(String from, String to) {
    final requests = <Uri>[];
    Response answer(Uri url) {
      requests.add(url);
      final address = url.toString();
      if (address.startsWith(from)) {
        return Response('', 308, headers: {'location': address.replaceFirst(from, to)}, isRedirect: true);
      }
      return switch (url.path) {
        '/.well-known/immich' => Response('{"api":{"endpoint":"/api"}}', 200),
        '/api/server/ping' => Response('{"res":"pong"}', 200),
        _ => Response('', 404),
      };
    }

    NetworkRepository.client = MockClient((request) async {
      var url = request.url;
      var response = answer(url);
      while (request.followRedirects && response.isRedirect) {
        url = url.resolve(response.headers['location']!);
        response = answer(url);
      }
      return response;
    });
    return requests;
  }

  group('resolveEndpoint', () {
    test('Should use https when the server redirects http to https', () async {
      redirect('http://immich.test', 'https://immich.test');

      expect(await ApiService().resolveEndpoint('http://immich.test'), 'https://immich.test/api');
    });

    test('Should ask before sending anything to another server the address redirects to', () async {
      final requests = redirect('http://immich.test', 'https://other.test');

      await expectLater(
        ApiService().resolveEndpoint('http://immich.test'),
        throwsA(isA<ServerRedirectException>().having((e) => e.to.origin, 'to', 'https://other.test')),
      );
      expect(requests.where((url) => url.host == 'other.test'), isEmpty);
    });

    test('Should ask when only the well-known redirects to another server', () async {
      redirect('http://immich.test/.well-known', 'https://other.test/.well-known');

      await expectLater(
        ApiService().resolveEndpoint('http://immich.test'),
        throwsA(isA<ServerRedirectException>().having((e) => e.to.origin, 'to', 'https://other.test')),
      );
    });
  });
}
