import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';

@RoutePage()
class MainTimelinePage extends StatelessWidget {
  const MainTimelinePage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Timeline();
  }
}

@RoutePage()
class LocalAlbumPage extends StatelessWidget {
  const LocalAlbumPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Timeline();
  }
}

@RoutePage()
class RemoteAlbumPage extends StatelessWidget {
  const RemoteAlbumPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Timeline();
  }
}
