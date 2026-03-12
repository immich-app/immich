import 'package:home_widget/home_widget.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';

final widgetServiceProvider = Provider((_) => const WidgetService());

class WidgetService {
  const WidgetService();

  Future<void> refreshWidgets() async {
    for (final (iOSName, androidName) in kWidgetNames) {
      await HomeWidget.updateWidget(iOSName: iOSName, qualifiedAndroidName: androidName);
    }
  }
}
