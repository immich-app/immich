import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

// Error widget to be used in Scaffold when an AsyncError is received
class ScaffoldErrorBody extends StatelessWidget {
  const ScaffoldErrorBody({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          "scaffold_body_error_occured",
          style: context.textTheme.displayMedium?.copyWith(height: 3),
          textAlign: TextAlign.center,
        ).tr(),
        Center(
          child: Icon(
            Icons.error_outline,
            size: 100,
            color: context.themeData.iconTheme.color?.withOpacity(0.5),
          ),
        ),
      ],
    );
  }
}
