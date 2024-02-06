import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/memories/models/memory.dart';

class MemoryBottomInfo extends StatelessWidget {
  final Memory memory;

  const MemoryBottomInfo({super.key, required this.memory});

  @override
  Widget build(BuildContext context) {
    final df = DateFormat.yMMMMd();
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
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
        ],
      ),
    );
  }
}
