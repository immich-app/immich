import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/memories/models/memory.dart';
import 'package:immich_mobile/modules/memories/providers/memory_auto_play.provider.dart';

class MemoryBottomInfo extends StatelessWidget {
  final Memory memory;

  const MemoryBottomInfo({super.key, required this.memory});

  @override
  Widget build(BuildContext context) {
    final df = DateFormat.yMMMMd();
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                memory.title,
                style: TextStyle(
                  color: Colors.grey[400],
                  fontSize: 13.0,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                df.format(
                  memory.assets[0].fileCreatedAt,
                ),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15.0,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          Consumer(
            builder: (_, ref, __) => MaterialButton(
              minWidth: 0,
              onPressed: () =>
                  ref.read(memoryAutoPlayProvider.notifier).toggleAutoPlay(),
              shape: const CircleBorder(),
              color: Colors.white.withOpacity(0.2),
              elevation: 0,
              child: Icon(
                ref.watch(memoryAutoPlayProvider)
                    ? Icons.pause_circle_outline_rounded
                    : Icons.play_circle_outline_rounded,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
