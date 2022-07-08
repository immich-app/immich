
1.1.0 / 2017-04-06
==================

  * Fix font width calculation for CJK language
  * Fix `package.main` for TypeScript (Closes #14)
  * Example of a currency printer function in readme.md was misleading
  * Add note about columns order

1.0.0 / 2015-05-25
==================

This version introduces new simpler and cleaner implementation,
albeit with some incompatible changes.

  * Added: support for colors
  * Change: Rename `Table.RightPadder()`, `Table.LeftPadder()`, `Table.Number()` to
  `Table.rightPadder()`, `Table.leftPadder()` and `Table.number()` respectively
  * Change: `.total()` signature
  * Change: `.printTransposed()` signature
  * Change: `Table.print()` meaning
  * Removed: `Table.printArray()`, `Table.printObj()`
  in favor of single `Table.print()` function
  * Removed: `width` parameter for `.cell()`
  * Removed: `.newLine()`
  * Columns now are always ordered according to their positions in rows. Previously that wasn't
  always the case, for example when some cells were missing in some rows.


0.3.0 / 2014-02-02
==================

  * Change: `printObj()` should print only self properties

# 0.2.0 / 2012-07-25

  * Add Table.printArray(), Table.printObj()
  * Add support for printing transposed version (Closes #2)

# 0.1.0

  * Added: `.total()` function
  * Change: printers are stored on per cell basis
  * Change: `.newLine()` renamed to `.newRow()`
  * Mark `.rows` and `.columns` as a public api

# 0.0.2

  * Added: `.sort()` function

# 0.0.1

  * Initial release
