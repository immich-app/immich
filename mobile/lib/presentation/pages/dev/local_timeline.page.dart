import 'package:auto_route/auto_route.dart';
import 'package:flutter/widgets.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';

@RoutePage()
class LocalTimelinePage extends StatelessWidget {
  const LocalTimelinePage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Timeline();
  }
}
