import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/repositories/widget.repository.dart';

final widgetServiceProvider = Provider((ref) {
  return WidgetService(ref.watch(widgetRepositoryProvider));
});

class WidgetService {
  final WidgetRepository _repository;

  const WidgetService(this._repository);

  Future<void> writeCredentials(String serverURL, String sessionKey, String? customHeaders) async {
    await _repository.setAppGroupId(appShareGroupId);
    await _repository.saveData(kWidgetServerEndpoint, serverURL);
    await _repository.saveData(kWidgetAuthToken, sessionKey);

    if (customHeaders != null && customHeaders.isNotEmpty) {
      await _repository.saveData(kWidgetCustomHeaders, customHeaders);
    }

    // wait 3 seconds to ensure the widget is updated, dont block
    Future.delayed(const Duration(seconds: 3), refreshWidgets);
  }

  Future<void> clearCredentials() async {
    await _repository.setAppGroupId(appShareGroupId);
    await _repository.saveData(kWidgetServerEndpoint, "");
    await _repository.saveData(kWidgetAuthToken, "");
    await _repository.saveData(kWidgetCustomHeaders, "");

    // wait 3 seconds to ensure the widget is updated, dont block
    Future.delayed(const Duration(seconds: 3), refreshWidgets);
  }

  Future<void> refreshWidgets() async {
    for (final (iOSName, androidName) in kWidgetNames) {
      await _repository.refresh(iOSName, androidName);
    }
  }
}
