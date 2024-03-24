import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/search/providers/people.provider.dart';

class PeoplePicker extends HookConsumerWidget {
  const PeoplePicker({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final people = ref.watch(getAllPeopleProvider);

    return Container();
  }
}
