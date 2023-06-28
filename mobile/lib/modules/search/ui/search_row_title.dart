import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

class SearchRowTitle extends StatelessWidget {
  final Function() onViewAllPressed;
  final String title;
  final double top;

  const SearchRowTitle({
    super.key,
    required this.onViewAllPressed,
    required this.title,
    this.top = 12,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16.0,
        right: 16.0,
        top: top,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.w500,
              fontSize: 16.0,
            ),
          ),
          TextButton(
            onPressed: onViewAllPressed,
            child: Text(
              'search_page_view_all_button',
              style: TextStyle(
                color: Theme.of(context).primaryColor,
                fontWeight: FontWeight.w500,
                fontSize: 14.0,
              ),
            ).tr(),
          ),
        ],
      ),
    );
  }
}
