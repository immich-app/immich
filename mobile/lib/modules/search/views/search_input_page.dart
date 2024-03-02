import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

@RoutePage()
class SearchInputPage extends HookConsumerWidget {
  const SearchInputPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: true,
        title: TextField(
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'search_bar_hint'.tr(),
            hintStyle: context.textTheme.bodyLarge?.copyWith(
              color: context.themeData.colorScheme.onSurface.withOpacity(0.75),
            ),
            enabledBorder: const UnderlineInputBorder(
              borderSide: BorderSide(color: Colors.transparent),
            ),
            focusedBorder: const UnderlineInputBorder(
              borderSide: BorderSide(color: Colors.transparent),
            ),
          ),
          onSubmitted: (value) {},
        ),
      ),
      body: Column(
        children: [
          SizedBox(
            height: 50,
            child: ListView(
              shrinkWrap: true,
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.only(left: 16),
              children: [
                SearchFilterChip(onTap: () {}, label: 'People'),
                SearchFilterChip(onTap: () {}, label: 'Places'),
                SearchFilterChip(onTap: () {}, label: 'Camera'),
                SearchFilterChip(onTap: () {}, label: 'Date'),
                SearchFilterChip(onTap: () {}, label: 'Media Type'),
                SearchFilterChip(onTap: () {}, label: 'Display Options'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SearchFilterChip extends StatelessWidget {
  final String label;
  final Function() onTap;
  const SearchFilterChip({super.key, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        elevation: 0,
        shape:
            StadiumBorder(side: BorderSide(color: Colors.grey.withAlpha(100))),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 2.0, horizontal: 14.0),
          child: Row(
            children: [
              Text(label),
              const Icon(
                Icons.arrow_drop_down,
                size: 24,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
