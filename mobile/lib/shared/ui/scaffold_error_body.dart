import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

// Error widget to be used in Scaffold when an AsyncError is received
class ScaffoldErrorBody extends StatelessWidget {
  final IconData icon;

  const ScaffoldErrorBody({this.icon = Icons.error_outline, super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text(
          "scaffold_body_error_occured",
          style:
              TextStyle(fontSize: 14, fontWeight: FontWeight.bold, height: 3),
          textAlign: TextAlign.center,
        ).tr(),
        Center(
          child: Icon(
            icon,
            size: 100,
            color: context.themeData.iconTheme.color?.withOpacity(0.5),
          ),
        ),
      ],
    );
  }
}
