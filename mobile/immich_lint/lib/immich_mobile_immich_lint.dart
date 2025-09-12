import 'package:analyzer/dart/ast/ast.dart';
import 'package:analyzer/dart/element/element2.dart';
import 'package:analyzer/error/error.dart' show ErrorSeverity, AnalysisError;
import 'package:analyzer/error/listener.dart';
import 'package:analyzer/source/source_range.dart';
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

    if (configs.rules[NoDebugPrintRule.name]?.enabled ?? true) {
      rules.add(NoDebugPrintRule());
    }
    return rules;
  }

  static LintCode makeCode(String name, LintOptions options) => LintCode(
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
      _rootOffset =
          resolver.path.toLowerCase().indexOf(project) + project.length;
    }
    final path = resolver.path.substring(_rootOffset);

    if ((_allowed != null && _allowed!.matches(path)) &&
        (_forbidden == null || !_forbidden!.matches(path))) {
      return;
    }

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

class NoDebugPrintRule extends DartLintRule {
  static const name = 'no_debug_print';
  static const importPath = 'package:flutter/src/foundation/print.dart';
  static const _code = LintCode(
    name: name,
    problemMessage:
        'Use dPrint instead of debugPrint for proper tree-shaking in release builds.',
    correctionMessage: 'Replace debugPrint with dPrint',
    errorSeverity: ErrorSeverity.WARNING,
  );

  NoDebugPrintRule() : super(code: _code);

  @pragma('vm:prefer-inline')
  static bool isDebugPrint(Element2? element) {
    return element is PropertyAccessorElement2 &&
        element.variable3?.getter2?.name3 == 'debugPrint' &&
        element.library2.identifier == importPath;
  }

  @pragma('vm:prefer-inline')
  static bool isWrapped(AstNode node) {
    AstNode? parent = node.parent;
    while (parent != null) {
      if (parent case IfStatement(:SimpleIdentifier expression)
          when expression.name == 'kDebugMode') {
        return true;
      }
      parent = parent.parent;
    }

    return false;
  }

  @override
  void run(
    CustomLintResolver resolver,
    ErrorReporter reporter,
    CustomLintContext context,
  ) {
    context.registry.addFunctionExpressionInvocation((node) {
      final function = node.function;
      if (function case SimpleIdentifier(:final element)
          when isDebugPrint(element) && !isWrapped(node)) {
        reporter.atNode(function, code);
      }
    });

    context.registry.addMethodInvocation((node) {
      final methodName = node.methodName;
      if (isDebugPrint(methodName.element) && !isWrapped(node)) {
        reporter.atNode(methodName, code);
      }
    });
  }

  @override
  List<Fix> getFixes() => [ReplaceDebugPrintFix()];
}

class ReplaceDebugPrintFix extends DartFix {
  static const dPrintImportPath =
      "import 'package:immich_mobile/utils/debug_print.dart';";

  @override
  void run(
    CustomLintResolver resolver,
    ChangeReporter reporter,
    CustomLintContext context,
    AnalysisError error,
    List<AnalysisError> allErrors,
  ) {
    context.registry.addFunctionExpressionInvocation((node) {
      final function = node.function;
      if (error.sourceRange == function.sourceRange &&
          function is SimpleIdentifier &&
          NoDebugPrintRule.isDebugPrint(function.element)) {
        _createFix(reporter, resolver, function, node);
      }
    });

    context.registry.addMethodInvocation((node) {
      final methodName = node.methodName;
      if (error.sourceRange == methodName.sourceRange &&
          NoDebugPrintRule.isDebugPrint(methodName.element)) {
        _createFix(reporter, resolver, methodName, node);
      }
    });
  }

  void _createFix(
    ChangeReporter reporter,
    CustomLintResolver resolver,
    SimpleIdentifier identifier,
    AstNode node,
  ) {
    final arguments = switch (node) {
      MethodInvocation(:final argumentList) => argumentList,
      FunctionExpressionInvocation(:final argumentList) => argumentList,
      _ => null,
    };
    if (arguments == null) {
      return;
    }

    final changeBuilder = reporter.createChangeBuilder(
      message: 'Replace with dPrint',
      priority: 1,
    );

    changeBuilder.addDartFileEdit((builder) {
      builder.addSimpleReplacement(identifier.sourceRange, 'dPrint');
      final firstArg = arguments.arguments.firstOrNull;
      if (firstArg != null) {
        final argSource = resolver.source.contents.data.substring(
          firstArg.offset,
          firstArg.end,
        );

        builder.addSimpleReplacement(
          SourceRange(firstArg.offset, firstArg.length),
          '() => $argSource',
        );
      }

      if (resolver.source.contents.data.contains(dPrintImportPath)) {
        return;
      }

      final unit = node.root;
      if (unit is CompilationUnit) {
        final lastImport =
            unit.directives.whereType<ImportDirective>().lastOrNull;

        if (lastImport != null) {
          builder.addSimpleInsertion(lastImport.end, '\n$dPrintImportPath');
        } else if (unit.directives.isNotEmpty) {
          builder.addSimpleInsertion(
              unit.directives.last.end, '\n\n$dPrintImportPath');
        } else {
          builder.addSimpleInsertion(0, '$dPrintImportPath\n\n');
        }
      }
    });
  }
}
