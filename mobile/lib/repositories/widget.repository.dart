import 'package:home_widget/home_widget.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/widget.interface.dart';

final widgetRepositoryProvider = Provider((ref) => WidgetRepository());

class WidgetRepository implements IWidgetRepository {
  WidgetRepository();

  @override
  void saveWidgetData(String key, String value) {
    HomeWidget.saveWidgetData<String>(key, value);
  }

  @override
  void updateWidget(String name) {
    HomeWidget.updateWidget(name: name, iOSName: name);
  }

  @override
  void setAppGroupId(String appGroupId) {
    HomeWidget.setAppGroupId(appGroupId);
  }
}
