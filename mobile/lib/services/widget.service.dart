import 'dart:convert';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/repositories/auth.repository.dart';
import 'package:immich_mobile/repositories/widget.repository.dart';

final widgetServiceProvider = Provider((ref) {
  return WidgetService(
    ref.watch(widgetRepositoryProvider),
    ref.watch(authRepositoryProvider),
  );
});

class WidgetService {
  final WidgetRepository _widgetRepository;
  final AuthRepository _authRepository;

  WidgetService(this._widgetRepository, this._authRepository);

  Future<void> writeSessionKey(
    String sessionKey,
  ) async {
    await _widgetRepository.setAppGroupId(appShareGroupId);
    await _widgetRepository.saveData(kWidgetAuthToken, sessionKey);

    // wait 3 seconds to ensure the widget is updated, dont block
    Future.delayed(const Duration(seconds: 3), refreshWidgets);
  }

  Future<void> writeServerList() async {
    await _widgetRepository.setAppGroupId(appShareGroupId);

    // create json string from serverURLS
    final serverURLSString = jsonEncode(_buildServerList());

    await _widgetRepository.saveData(kWidgetServerEndpoint, serverURLSString);
    Future.delayed(const Duration(seconds: 3), refreshWidgets);
  }

  List<String> _buildServerList() {
    final endpointList = _authRepository.getExternalEndpointList();

    final String? localEndpoint = Store.tryGet(StoreKey.localEndpoint);
    final String? serverUrl = Store.tryGet(StoreKey.serverUrl);

    final List<String> serverUrlList = endpointList.map((e) => e.url).toList();

    if (localEndpoint != null) {
      serverUrlList.insert(0, localEndpoint);
    }

    if (serverUrl != null) {
      serverUrlList.insert(0, serverUrl);
    }

    return serverUrlList.toSet().toList();
  }

  Future<void> clearCredentials() async {
    await _widgetRepository.setAppGroupId(appShareGroupId);
    await _widgetRepository.saveData(kWidgetServerEndpoint, "");
    await _widgetRepository.saveData(kWidgetAuthToken, "");

    // wait 3 seconds to ensure the widget is updated, dont block
    Future.delayed(const Duration(seconds: 3), refreshWidgets);
  }

  Future<void> refreshWidgets() async {
    for (final name in kWidgetNames) {
      await _widgetRepository.refresh(name);
    }
  }
}
