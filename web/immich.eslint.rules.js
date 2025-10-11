/**
 * ESLint rule: no-unlocalized-strings
 *
 * Ensures all string literals containing alphabetic characters are wrapped in t() function calls.
 * String literals without alpha characters (like "123", "---", etc.) are ignored.
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require string literals with alphabetic characters to be wrapped in t() function',
      category: 'Internationalization',
      recommended: true,
    },
    messages: {
      unlocalizedString: "String literal '{{text}}' should be wrapped in t() function for internationalization",
    },
    schema: [], // no options
  },

  create(context) {
    /**
     * Check if current file should be ignored
     */
    function shouldIgnoreFile() {
      const filename = context.getFilename();

      // Ignore test/spec files
      if (/\.(spec|test)\.(ts|tsx|js|jsx)$/.test(filename)) {
        return true;
      }

      // Ignore files in __tests__ directories
      if (filename.includes('__tests__')) {
        return true;
      }

      // Ignore files in test-data directories
      if (filename.includes('test-data')) {
        return true;
      }

      // Ignore config files
      if (/\.config\.(ts|js)$/.test(filename)) {
        return true;
      }

      return false;
    }

    // Skip entire file if it should be ignored
    if (shouldIgnoreFile()) {
      return {};
    }

    /**
     * Check if a node has an ignore comment
     * Supports: i18n-ignore, or standard eslint-disable
     */
    function hasIgnoreComment(node) {
      const sourceCode = context.getSourceCode();
      const comments = sourceCode.getCommentsBefore(node);

      // Check for i18n-ignore in comments on the same line or line before
      for (const comment of comments) {
        if (comment.value.trim().includes('i18n-ignore')) {
          return true;
        }
      }

      // Also check for inline comments on the same line
      const lineComments = sourceCode.getCommentsAfter(node);
      for (const comment of lineComments) {
        if (comment.loc.start.line === node.loc.start.line && comment.value.trim().includes('i18n-ignore')) {
          return true;
        }
      }

      return false;
    }

    /**
     * Check if a string contains any alphabetic characters
     */
    function containsAlphabeticChars(str) {
      return /[a-zA-Z]/.test(str);
    }

    /**
     * Check if a node is a direct argument to t() function call
     */
    function isInTranslationFunction(node) {
      const parent = node.parent;

      // Check if parent is a CallExpression with callee named 't' or '$t'
      if (parent && parent.type === 'CallExpression') {
        const callee = parent.callee;

        // Direct function call: t('string') or $t('string')
        if (callee.type === 'Identifier' && (callee.name === 't' || callee.name === '$t')) {
          return true;
        }

        // Member expression: this.t('string') or obj.t('string')
        if (
          callee.type === 'MemberExpression' &&
          callee.property.type === 'Identifier' &&
          (callee.property.name === 't' || callee.property.name === '$t')
        ) {
          return true;
        }
      }

      return false;
    }

    /**
     * Check if node is in a context where translation is not needed
     */
    function isInIgnoredContext(node) {
      let current = node.parent;

      while (current) {
        // Ignore object keys: { key: 'value' } - the 'key' part
        if (current.type === 'Property' && current.key === node) {
          return true;
        }

        // Ignore object property values for certain keys
        if (current.type === 'Property' && current.value === node) {
          const keyName = current.key?.name || current.key?.value;

          // List of object keys whose values don't need translation
          const nonTranslatableKeys = [
            'key',
            'keys',
            'shortcut',
            'hotkey',
            'keyCode',
            'code',
            'id',
            'type',
            'name',
            'ref',
            'testId',
            'dataTestId',
            'className',
            'class',
            'style',
            'href',
            'src',
            'alt',
            'role',
            'method',
            'action',
            'target',
            'rel',
            'as',
          ];

          if (nonTranslatableKeys.includes(keyName)) {
            return true;
          }

          // Ignore data-* properties
          if (typeof keyName === 'string' && keyName.startsWith('data-')) {
            return true;
          }
        }

        // Ignore import/export statements
        if (
          current.type === 'ImportDeclaration' ||
          current.type === 'ExportNamedDeclaration' ||
          current.type === 'ExportAllDeclaration'
        ) {
          return true;
        }

        // Ignore dynamic imports: import('module-name')
        if (current.type === 'ImportExpression') {
          return true;
        }

        // Ignore type annotations (TypeScript)
        if (current.type === 'TSLiteralType' || current.type === 'TSTypeReference') {
          return true;
        }

        // Ignore JSX/Svelte attribute values that are plain strings (not expressions)
        // For example: <div class="container"> or <Button variant="primary">
        if (current.type === 'JSXAttribute') {
          const attrName = current.name?.name;

          // List of attributes that typically don't need translation
          const nonTranslatableAttrs = [
            'class',
            'className',
            'id',
            'style',
            'type',
            'name',
            'value',
            'href',
            'src',
            'alt',
            'role',
            'data-testid',
            'key',
            'ref',
            'variant',
            'color',
            'size',
            'shape',
            'icon',
            'position',
            'align',
            'justify',
            'direction',
            'wrap',
            'gap',
            'spacing',
          ];

          // Also ignore any data-* or aria-* attributes except aria-label, aria-description
          const isDataAttr = attrName?.startsWith('data-');
          const isNonTextAriaAttr =
            attrName?.startsWith('aria-') &&
            attrName !== 'aria-label' &&
            attrName !== 'aria-description' &&
            attrName !== 'aria-placeholder';

          if (nonTranslatableAttrs.includes(attrName) || isDataAttr || isNonTextAriaAttr) {
            return true;
          }
        }

        current = current.parent;
      }

      return false;
    }

    return {
      Literal(node) {
        // Only check string literals
        if (typeof node.value !== 'string') {
          return;
        }

        const stringValue = node.value;

        // Skip strings without alphabetic characters
        if (!containsAlphabeticChars(stringValue)) {
          return;
        }

        // Skip if has ignore comment
        if (hasIgnoreComment(node)) {
          return;
        }

        // Skip if already wrapped in t() function
        if (isInTranslationFunction(node)) {
          return;
        }

        // Skip if in ignored context (object keys, imports, etc.)
        if (isInIgnoredContext(node)) {
          return;
        }

        // Report the violation
        context.report({
          node,
          messageId: 'unlocalizedString',
          data: {
            text: stringValue.length > 30 ? stringValue.substring(0, 30) + '...' : stringValue,
          },
        });
      },

      // Also handle template literals
      TemplateLiteral(node) {
        // Skip if it has expressions (e.g., `Hello ${name}`)
        if (node.expressions.length > 0) {
          return;
        }

        // Get the string value from quasis
        const stringValue = node.quasis[0]?.value.cooked || '';

        // Skip strings without alphabetic characters
        if (!containsAlphabeticChars(stringValue)) {
          return;
        }

        // Skip if has ignore comment
        if (hasIgnoreComment(node)) {
          return;
        }

        // Skip if already wrapped in t() function
        if (isInTranslationFunction(node)) {
          return;
        }

        // Skip if in ignored context
        if (isInIgnoredContext(node)) {
          return;
        }

        // Report the violation
        context.report({
          node,
          messageId: 'unlocalizedString',
          data: {
            text: stringValue.length > 30 ? stringValue.substring(0, 30) + '...' : stringValue,
          },
        });
      },
    };
  },
};
