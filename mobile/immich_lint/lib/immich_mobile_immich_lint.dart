import 'package:analyzer/error/listener.dart';
import 'package:analyzer/error/error.dart' show ErrorSeverity;
import 'package:custom_lint_builder/custom_lint_builder.dart';
// ignore: depend_on_referenced_packages
import 'package:glob/glob.dart';

PluginBase createPlugin() => ImmichLinter();

class ImmichLinter extends PluginBase {
  @override
  List<LintRule> getLintRules(CustomLintConfigs configs) {
    final List<LintRule> rules = [];
    for (final entry in configs.rules.entries) {
      if (entry.value.enabled && entry.key.startsWith("import_rule_")) {
        final code = makeCode(entry.key, entry.value);
        final allowedPaths = getStrings(entry.value, "allowed");
        final forbiddenPaths = getStrings(entry.value, "forbidden");
        final restrict = getStrings(entry.value, "restrict");
        rules.add(ImportRule(code, buildGlob(allowedPaths),
            buildGlob(forbiddenPaths), restrict));
      }
    }
    return rules;
  }

  static makeCode(String name, LintOptions options) => LintCode(
        name: name,
        problemMessage: options.json["message"] as String,
        errorSeverity: ErrorSeverity.WARNING,
      );

  static List<String> getStrings(LintOptions options, String field) {
    final List<String> result = [];
    final excludeOption = options.json[field];
    if (excludeOption is String) {
      result.add(excludeOption);
    } else if (excludeOption is List) {
      result.addAll(excludeOption.map((option) => option));
    }
    return result;
  }

  Glob? buildGlob(List<String> globs) {
    if (globs.isEmpty) return null;
    if (globs.length == 1) return Glob(globs[0], caseSensitive: true);
    return Glob("{${globs.join(",")}}", caseSensitive: true);
  }
}

// ignore: must_be_immutable
class ImportRule extends DartLintRule {
  ImportRule(LintCode code, this._allowed, this._forbidden, this._restrict)
      : super(code: code);

  final Glob? _allowed;
  final Glob? _forbidden;
  final List<String> _restrict;
  int _rootOffset = -1;

  @override
  void run(
    CustomLintResolver resolver,
    ErrorReporter reporter,
    CustomLintContext context,
  ) {
    if (_rootOffset == -1) {
      const project = "/immich/mobile/";
      _rootOffset = resolver.path.indexOf(project) + project.length;
    }
    final path = resolver.path.substring(_rootOffset);

    if ((_allowed != null && _allowed!.matches(path)) &&
        (_forbidden == null || !_forbidden!.matches(path))) return;

    context.registry.addImportDirective((node) {
      final uri = node.uri.stringValue;
      if (uri == null) return;
      for (final restricted in _restrict) {
        if (uri.startsWith(restricted) == true) {
          reporter.atNode(node, code);
          return;
        }
      }
    });
  }
}
