import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/interfaces/widget.interface.dart';
import 'package:immich_mobile/repositories/widget.repository.dart';

final widgetServiceProvider = Provider((ref) {
  return WidgetService(
    ref.watch(widgetRepositoryProvider),
  );
});

class WidgetService {
  final IWidgetRepository _repository;

  WidgetService(this._repository);

  Future<void> writeCredentials(String serverURL, String sessionKey) async {
    await _repository.setAppGroupId(appShareGroupId);
    await _repository.saveData(kWidgetServerEndpoint, serverURL);
    await _repository.saveData(kWidgetAuthToken, sessionKey);

    // wait 3 seconds to ensure the widget is updated, dont block
    Future.delayed(const Duration(seconds: 3), refreshWidgets);
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
