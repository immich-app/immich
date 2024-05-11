import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

// Error widget to be used in Scaffold when an AsyncError is received
class ScaffoldErrorBody extends StatelessWidget {
  final bool withIcon;
  final String? errorMsg;

  const ScaffoldErrorBody({super.key, this.withIcon = true, this.errorMsg});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          "scaffold_body_error_occurred",
          style: context.textTheme.displayMedium,
          textAlign: TextAlign.center,
        ).tr(),
        if (withIcon)
          Center(
            child: Padding(
              padding: const EdgeInsets.only(top: 15),
              child: Icon(
                Icons.error_outline,
                size: 100,
                color: context.themeData.iconTheme.color?.withOpacity(0.5),
              ),
            ),
          ),
        if (withIcon && errorMsg != null)
          Padding(
            padding: const EdgeInsets.all(20),
            child: Text(
              errorMsg!,
              style: context.textTheme.displaySmall,
              textAlign: TextAlign.center,
            ),
          ),
      ],
    );
  }
}
