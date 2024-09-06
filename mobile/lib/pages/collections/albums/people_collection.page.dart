import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

@RoutePage()
class PeopleCollectionPage extends HookConsumerWidget {
  const PeopleCollectionPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('people'),
      ),
      body: const Center(
        child: Text('people'),
      ),
    );
  }
}
