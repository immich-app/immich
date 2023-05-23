import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class PersonResultPage extends HookConsumerWidget {
  final String personId;
  final String personName;

  const PersonResultPage({
    super.key,
    required this.personId,
    required this.personName,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          personName,
          style: const TextStyle(
            fontSize: 16.0,
          ),
        ),
        leading: IconButton(
          onPressed: () => AutoRouter.of(context).pop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
      ),
      body: const Center(
        child: Text('Person Result Page'),
      ),
    );
  }
}
