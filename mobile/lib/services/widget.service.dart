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

  void writeCredentials(String serverURL, String sessionKey) {
    _repository.saveWidgetData(kWidgetServerEndpoint, serverURL);
    _repository.saveWidgetData(kWidgetAuthToken, sessionKey);
  }

  void clearWidgetData() {
    _repository.saveWidgetData(kWidgetServerEndpoint, "");
    _repository.saveWidgetData(kWidgetAuthToken, "");
  }

  void updateWidget(String name) {
    _repository.updateWidget(name);
  }

  void setAppGroupId(String appGroupId) {
    _repository.setAppGroupId(appGroupId);
  }
}
