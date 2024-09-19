import 'dart:collection';

import 'package:analyzer/error/listener.dart';
import 'package:analyzer/error/error.dart' show ErrorSeverity;
import 'package:custom_lint_builder/custom_lint_builder.dart';

PluginBase createPlugin() => ImmichLinter();

class ImmichLinter extends PluginBase {
  @override
  List<LintRule> getLintRules(CustomLintConfigs configs) => [
        PhotoManagerRule(configs.rules[PhotoManagerRule._code.name]),
      ];
}

class PhotoManagerRule extends DartLintRule {
  PhotoManagerRule(LintOptions? options) : super(code: _code) {
    final excludeOption = options?.json["exclude"];
    if (excludeOption is String) {
      _excludePaths.add(excludeOption);
    } else if (excludeOption is List) {
      _excludePaths.addAll(excludeOption.map((option) => option));
    }
  }

  final Set<String> _excludePaths = HashSet();

  static const _code = LintCode(
    name: 'photo_manager',
    problemMessage:
        'photo_manager library must only be used in MediaRepository',
    errorSeverity: ErrorSeverity.WARNING,
  );

  @override
  void run(
    CustomLintResolver resolver,
    ErrorReporter reporter,
    CustomLintContext context,
  ) {
    if (_excludePaths.contains(resolver.source.shortName)) return;

    context.registry.addImportDirective((node) {
      if (node.uri.stringValue?.startsWith("package:photo_manager") == true) {
        reporter.atNode(node, code);
      }
    });
  }
}
