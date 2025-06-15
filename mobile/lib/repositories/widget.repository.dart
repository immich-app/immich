import 'package:home_widget/home_widget.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/widget.interface.dart';

final widgetRepositoryProvider = Provider((_) => WidgetRepository());

class WidgetRepository implements IWidgetRepository {
  WidgetRepository();

  @override
  Future<void> saveData(String key, String value) async {
    await HomeWidget.saveWidgetData<String>(key, value);
  }

  @override
  Future<void> refresh(String name) async {
    await HomeWidget.updateWidget(name: name, iOSName: name);
  }

  @override
  Future<void> setAppGroupId(String appGroupId) async {
    await HomeWidget.setAppGroupId(appGroupId);
  }
}
