import 'dart:convert';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:immich_mobile/infrastructure/repositories/network.repository.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:openapi/api.dart';

final memoryDockStyleTransformRepositoryProvider = Provider(
  (ref) => MemoryDockStyleTransformRepository(ref.watch(apiServiceProvider)),
);

class MemoryDockStyleTransformRepository {
  final ApiService _apiService;
  final http.Client? _httpClient;

  const MemoryDockStyleTransformRepository(this._apiService, {this._httpClient});

  Future<void> submit({required String assetId, required String style}) async {
    final endpoint = _apiService.apiClient.basePath;
    if (endpoint.isEmpty) {
      throw ApiException(503, 'Server endpoint is not configured');
    }

    final response = await (_httpClient ?? NetworkRepository.client).post(
      Uri.parse('$endpoint/memorydock/style-transforms'),
      headers: const {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: jsonEncode({'assetId': assetId, 'style': style}),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(response.statusCode, response.body);
    }
  }
}
