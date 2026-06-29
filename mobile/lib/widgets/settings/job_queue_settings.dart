import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/queues.provider.dart';
import 'package:immich_mobile/widgets/settings/queue_card_button.dart';
import 'package:openapi/api.dart';

class _ButtonConfig {
  final IconData icon;
  final String label;
  final String action;

  const _ButtonConfig({required this.icon, required this.label, required this.action});
}

class JobQueueSettings extends ConsumerWidget {
  const JobQueueSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(queuesProvider);
    final queues = ref.watch(queuesProvider);

    if (queues.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      itemCount: _visibleQueueNames.length,
      itemBuilder: (context, index) {
        final name = _visibleQueueNames[index];
        return _QueueTile(name: name);
      },
    );
  }

  static const _visibleQueueNames = [
    'thumbnailGeneration',
    'metadataExtraction',
    'library',
    'sidecar',
    'smartSearch',
    'duplicateDetection',
    'faceDetection',
    'facialRecognition',
    'ocr',
    'videoConversion',
    'storageTemplateMigration',
    'migration',
    // 'backgroundTask',
    // 'search',
    // 'notifications',
    // 'backupDatabase',
    // 'workflow',
    // 'editor',
  ];
}

class _QueueTile extends ConsumerWidget {
  const _QueueTile({required this.name});

  final String name;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(queuesProvider);
    final queue = ref.watch(queueByNameProvider(name));

    if (queue == null) {
      return const SizedBox.shrink();
    }

    final queueInfo = _getQueueInfo(name);
    final title = queueInfo['title']!;
    final subtitle = queueInfo['subtitle'];
    final icon = queueInfo['icon'] as IconData;
    final actions = queueInfo['actions'] as Map<String, dynamic>;

    final stats = queue.statistics;
    final waitingCount = stats.waiting + stats.paused + stats.delayed;
    final isIdle = stats.active == 0 && waitingCount == 0 && !queue.isPaused;
    final hasWaitingJobs = waitingCount > 0;

    final isDisabled = actions['disabled'] == true;
    final allText = actions['allText'] as String?;
    final refreshText = actions['refreshText'] as String?;
    final missingText = actions['missingText'] as String?;

    final hasHeader = queue.isPaused || stats.active > 0;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8.0),
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(12)),
        side: hasHeader
            ? BorderSide(color: queue.isPaused ? Colors.orange.shade100 : Colors.green.shade100, width: 1.5)
            : BorderSide.none,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (hasHeader)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 12),
              decoration: BoxDecoration(
                color: queue.isPaused ? Colors.orange.shade100 : Colors.green.shade100,
                borderRadius: const BorderRadius.only(topLeft: Radius.circular(12), topRight: Radius.circular(12)),
              ),
              child: Center(
                child: Text(
                  queue.isPaused ? tr('paused') : tr('active'),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: queue.isPaused ? Colors.orange.shade800 : Colors.green.shade800,
                  ),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 6),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(icon, size: 24, color: Theme.of(context).primaryColor),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(tr(title), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                    ),
                    if (subtitle != null) _buildInfoButton(context, tr(title), tr(subtitle)),
                  ],
                ),
                const SizedBox(height: 8),
                if (stats.failed > 0 || stats.delayed > 0)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        if (stats.failed > 0)
                          _buildBadge(
                            context,
                            '${tr('admin.jobs_failed')} ${stats.failed}',
                            Icons.error_outline,
                            Colors.red.shade100,
                            Colors.red.shade800,
                          ),
                        if (stats.delayed > 0)
                          _buildBadge(
                            context,
                            '${tr('admin.jobs_delayed')} ${stats.delayed}',
                            Icons.schedule,
                            Colors.orange.shade100,
                            Colors.orange.shade800,
                          ),
                      ],
                    ),
                  ),
                Row(
                  children: [
                    StatisticBox(
                      label: tr('active'),
                      value: stats.active,
                      colorScheme: StatisticBoxColorScheme.primary,
                    ),
                    const SizedBox(width: 8),
                    StatisticBox(
                      label: tr('waiting'),
                      value: waitingCount,
                      colorScheme: StatisticBoxColorScheme.tertiary,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildActionButtons(
                  ref,
                  context,
                  isDisabled: isDisabled,
                  isIdle: isIdle,
                  isPaused: queue.isPaused,
                  hasWaitingJobs: hasWaitingJobs,
                  allText: allText,
                  refreshText: refreshText,
                  missingText: missingText,
                  queueName: name,
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoButton(BuildContext context, String title, String description) {
    return InkWell(
      onTap: () => _showDescriptionPopup(context, title, description),
      borderRadius: const BorderRadius.all(Radius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(4),
        child: Icon(Icons.info_outline, size: 20, color: Theme.of(context).primaryColor),
      ),
    );
  }

  Widget _buildBadge(_, String text, IconData icon, Color backgroundColor, Color textColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: backgroundColor, borderRadius: const BorderRadius.all(Radius.circular(12))),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: textColor),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(fontSize: 11, color: textColor, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(
    WidgetRef ref,
    _, {
    required bool isDisabled,
    required bool isIdle,
    required bool isPaused,
    required bool hasWaitingJobs,
    String? allText,
    String? refreshText,
    String? missingText,
    required String queueName,
  }) {
    if (isDisabled) {
      return Row(
        children: [
          QueueCardButton(
            icon: Icons.block,
            label: tr('disabled'),
            color: QueueCardButtonColor.secondary,
            disabled: true,
            onTap: () => _onAction(ref, 'disabled', queueName),
          ),
        ],
      );
    }

    final buttons = _getButtonConfigs(
      isIdle: isIdle,
      isPaused: isPaused,
      hasWaitingJobs: hasWaitingJobs,
      allText: allText,
      refreshText: refreshText,
      missingText: missingText,
    );

    return Row(
      children: [
        for (int i = 0; i < buttons.length; i++) ...[
          if (i > 0) const SizedBox(width: 8),
          Expanded(
            child: QueueCardButton(
              icon: buttons[i].icon,
              label: buttons[i].label,
              color: QueueCardButtonColor.outlined,
              onTap: () => _onAction(ref, buttons[i].action, queueName),
            ),
          ),
        ],
      ],
    );
  }

  List<_ButtonConfig> _getButtonConfigs({
    required bool isIdle,
    required bool isPaused,
    required bool hasWaitingJobs,
    String? allText,
    String? refreshText,
    String? missingText,
  }) {
    if (isIdle) {
      if (allText != null || refreshText != null || missingText != null) {
        return [
          if (allText != null) _ButtonConfig(icon: Icons.all_inclusive, label: allText, action: 'all'),
          if (refreshText != null) _ButtonConfig(icon: Icons.refresh, label: refreshText, action: 'refresh'),
          if (missingText != null) _ButtonConfig(icon: Icons.search, label: missingText, action: 'missing'),
        ];
      }
      return [_ButtonConfig(icon: Icons.play_arrow, label: missingText ?? tr('start'), action: 'start')];
    }

    return [
      if (hasWaitingJobs) _ButtonConfig(icon: Icons.clear, label: tr('clear'), action: 'clear'),
      _ButtonConfig(
        icon: isPaused ? Icons.fast_forward : Icons.pause,
        label: isPaused ? tr('resume') : tr('pause'),
        action: isPaused ? 'resume' : 'pause',
      ),
      if (missingText != null) _ButtonConfig(icon: Icons.search, label: missingText, action: 'missing'),
    ];
  }

  void _onAction(WidgetRef ref, String action, String queueName) {
    final queueNameEnum = QueueName.values.firstWhere(
      (e) => e.value == queueName,
      orElse: () => QueueName.backgroundTask,
    );
    final notifier = ref.read(queuesProvider.notifier);

    switch (action) {
      case 'disabled':
        break;
      case 'all':
        notifier.runCommand(queueNameEnum, QueueCommand.start, force: true);
        break;
      case 'refresh':
        notifier.runCommand(queueNameEnum, QueueCommand.start, force: null);
        break;
      case 'missing':
      case 'start':
        notifier.runCommand(queueNameEnum, QueueCommand.start, force: false);
        break;
      case 'pause':
        notifier.pauseQueue(queueNameEnum);
        break;
      case 'resume':
        notifier.resumeQueue(queueNameEnum);
        break;
      case 'clear':
        notifier.emptyQueue(queueNameEnum, failed: false);
        break;
      case 'clear-failed':
        notifier.emptyQueue(queueNameEnum, failed: true);
        break;
    }
  }

  void _showDescriptionPopup(BuildContext context, String title, String description) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(description),
        actions: [TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('OK'))],
      ),
    );
  }

  Map<String, dynamic> _getQueueInfo(String name) {
    return switch (name) {
      'thumbnailGeneration' => {
        'title': 'admin.thumbnail_generation_job',
        'subtitle': 'admin.thumbnail_generation_job_description',
        'icon': Icons.image_outlined,
        'actions': {'allText': tr('all'), 'missingText': tr('missing'), 'disabled': false},
      },
      'metadataExtraction' => {
        'title': 'admin.metadata_extraction_job',
        'subtitle': 'admin.metadata_extraction_job_description',
        'icon': Icons.table_chart_outlined,
        'actions': {'allText': tr('all'), 'missingText': tr('missing'), 'disabled': false},
      },
      'videoConversion' => {
        'title': 'admin.video_conversion_job',
        'subtitle': 'admin.video_conversion_job_description',
        'icon': Icons.movie_outlined,
        'actions': {'allText': tr('all'), 'missingText': tr('missing'), 'disabled': false},
      },
      'faceDetection' => {
        'title': 'admin.face_detection',
        'subtitle': 'admin.face_detection_description',
        'icon': Icons.face_outlined,
        'actions': {
          'allText': tr('reset'),
          'refreshText': tr('refresh'),
          'missingText': tr('missing'),
          'disabled': false,
        },
      },
      'facialRecognition' => {
        'title': 'admin.machine_learning_facial_recognition',
        'subtitle': 'admin.facial_recognition_job_description',
        'icon': Icons.tag_faces_outlined,
        'actions': {'allText': tr('reset'), 'missingText': tr('missing'), 'disabled': false},
      },
      'smartSearch' => {
        'title': 'admin.machine_learning_smart_search',
        'subtitle': 'admin.smart_search_job_description',
        'icon': Icons.image_search_outlined,
        'actions': {'allText': tr('all'), 'missingText': tr('missing'), 'disabled': false},
      },
      'duplicateDetection' => {
        'title': 'admin.machine_learning_duplicate_detection',
        'subtitle': 'admin.duplicate_detection_job_description',
        'icon': Icons.content_copy_outlined,
        'actions': {'allText': tr('all'), 'missingText': tr('missing'), 'disabled': false},
      },
      'backgroundTask' => {
        'title': 'admin.background_task_job',
        'subtitle': null,
        'icon': Icons.inbox_outlined,
        'actions': {'disabled': false},
      },
      'storageTemplateMigration' => {
        'title': 'admin.storage_template_migration',
        'subtitle': null,
        'icon': Icons.folder_outlined,
        'actions': {'missingText': tr('start'), 'disabled': false},
      },
      'migration' => {
        'title': 'admin.migration_job',
        'subtitle': 'admin.migration_job_description',
        'icon': Icons.sync_outlined,
        'actions': {'missingText': tr('start'), 'disabled': false},
      },
      'search' => {
        'title': 'search',
        'subtitle': null,
        'icon': Icons.search_outlined,
        'actions': {'disabled': false},
      },
      'sidecar' => {
        'title': 'admin.sidecar_job',
        'subtitle': 'admin.sidecar_job_description',
        'icon': Icons.code_outlined,
        'actions': {'allText': tr('sync'), 'missingText': tr('discover'), 'disabled': false},
      },
      'library' => {
        'title': 'external_libraries',
        'subtitle': 'admin.library_tasks_description',
        'icon': Icons.library_books_outlined,
        'actions': {'missingText': tr('rescan'), 'disabled': false},
      },
      'notifications' => {
        'title': 'notifications',
        'subtitle': null,
        'icon': Icons.notifications_outlined,
        'actions': {'disabled': false},
      },
      'backupDatabase' => {
        'title': 'admin.backup_database',
        'subtitle': null,
        'icon': Icons.storage_outlined,
        'actions': {'disabled': false},
      },
      'ocr' => {
        'title': 'admin.machine_learning_ocr',
        'subtitle': 'admin.ocr_job_description',
        'icon': Icons.text_fields_outlined,
        'actions': {'allText': tr('all'), 'missingText': tr('missing'), 'disabled': false},
      },
      'workflow' => {
        'title': 'workflows',
        'subtitle': null,
        'icon': Icons.account_tree_outlined,
        'actions': {'disabled': false},
      },
      'editor' => {
        'title': 'editor',
        'subtitle': null,
        'icon': Icons.edit_outlined,
        'actions': {'disabled': false},
      },
      _ => {
        'title': name,
        'subtitle': null,
        'icon': Icons.work_outlined,
        'actions': {'disabled': false},
      },
    };
  }
}
