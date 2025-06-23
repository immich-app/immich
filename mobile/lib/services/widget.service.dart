import 'dart:convert';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';
import 'package:immich_mobile/repositories/widget.repository.dart';

final widgetServiceProvider = Provider((ref) {
  return WidgetService(
    ref.watch(widgetRepositoryProvider),
  );
});

class WidgetService {
  final WidgetRepository _repository;

  WidgetService(this._repository);

  Future<void> writeSessionKey(
    String sessionKey,
  ) async {
    await _repository.setAppGroupId(appShareGroupId);
    await _repository.saveData(kWidgetAuthToken, sessionKey);

    // wait 3 seconds to ensure the widget is updated, dont block
    Future.delayed(const Duration(seconds: 3), refreshWidgets);
  }

  Future<void> writeServerList() async {
    await _repository.setAppGroupId(appShareGroupId);

    // create json string from serverURLS
    final serverURLSString = jsonEncode(_buildServerList());

    await _repository.saveData(kWidgetServerEndpoint, serverURLSString);
    Future.delayed(const Duration(seconds: 3), refreshWidgets);
  }

  List<String> _buildServerList() {
    final List<dynamic> jsonList =
        jsonDecode(Store.tryGet(StoreKey.externalEndpointList) ?? "[]");
    final endpointList =
        jsonList.map((e) => AuxilaryEndpoint.fromJson(e)).toList();

    final String? localEndpoint = Store.tryGet(StoreKey.localEndpoint);
    final String? serverUrl = Store.tryGet(StoreKey.serverUrl);

    final List<String> serverUrlList = endpointList.map((e) => e.url).toList();

    if (localEndpoint != null) {
      serverUrlList.insert(0, localEndpoint);
    }

    if (serverUrl != null && serverUrl != localEndpoint) {
      serverUrlList.insert(0, serverUrl);
    }

    // remove duplicates
    final Set<String> uniqueServerUrls = serverUrlList.toSet();

    return uniqueServerUrls.toList();
  }

  Future<void> clearCredentials() async {
    await _repository.setAppGroupId(appShareGroupId);
    await _repository.saveData(kWidgetServerEndpoint, "");
    await _repository.saveData(kWidgetAuthToken, "");

    // wait 3 seconds to ensure the widget is updated, dont block
    Future.delayed(const Duration(seconds: 3), refreshWidgets);
  }

  Future<void> refreshWidgets() async {
    for (final name in kWidgetNames) {
      await _repository.refresh(name);
    }
  }
}
