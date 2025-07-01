import 'package:home_widget/home_widget.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

final widgetRepositoryProvider = Provider((_) => const WidgetRepository());

class WidgetRepository {
  const WidgetRepository();

  Future<void> saveData(String key, String value) async {
    await HomeWidget.saveWidgetData<String>(key, value);
  }

  Future<void> refresh(String name) async {
    await HomeWidget.updateWidget(name: name, iOSName: name);
  }

  Future<void> setAppGroupId(String appGroupId) async {
    await HomeWidget.setAppGroupId(appGroupId);
  }
}
