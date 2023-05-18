import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

class SearchRowTitle extends StatelessWidget {
  final VoidCallback onViewAllPressed;
  final String title;

  const SearchRowTitle({
    super.key,
    required this.onViewAllPressed,
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(
        left: 16.0,
        right: 16.0,
        top: 12.0,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleSmall,
          ),
          TextButton(
            onPressed: onViewAllPressed,
            child: Text(
              'search_page_view_all_button',
              style: TextStyle(
                color: Theme.of(context).primaryColor,
                fontWeight: FontWeight.bold,
                fontSize: 14.0,
              ),
            ).tr(),
          ),
        ],
      ),
    );
  }
}
