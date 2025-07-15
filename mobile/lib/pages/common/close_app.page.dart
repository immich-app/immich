import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

@RoutePage()
class ChangeExperiencePage extends StatelessWidget {
  const ChangeExperiencePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Image(
              image: AssetImage('assets/immich-logo.png'),
              width: 80,
              filterQuality: FilterQuality.high,
            ),
            const Padding(padding: EdgeInsets.only(top: 16.0)),
            Text(
              "Close and Reopen the app to apply changes",
              style: context.textTheme.displayLarge,
            ),
          ],
        ),
      ),
    );
  }
}
