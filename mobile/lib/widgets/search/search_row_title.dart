import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class SearchRowTitle extends StatelessWidget {
  const SearchRowTitle({
    super.key,
    required this.onViewAllPressed,
    required this.title,
  });

  final Function() onViewAllPressed;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: context.textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w500,
          ),
        ),
        TextButton(
          onPressed: onViewAllPressed,
          child: Text(
            'search_page_view_all_button',
            style: context.textTheme.labelLarge?.copyWith(
              color: context.primaryColor,
            ),
          ).tr(),
        ),
      ],
    );
  }
}
