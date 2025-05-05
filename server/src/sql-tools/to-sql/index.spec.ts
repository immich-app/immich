import { schemaDiffToSql } from 'src/sql-tools';
import { describe, expect, it } from 'vitest';

describe(schemaDiffToSql.name, () => {
  describe('comments', () => {
    it('should include the reason in a SQL comment', () => {
      expect(
        schemaDiffToSql(
          [
            {
              type: 'index.drop',
              indexName: 'IDX_test',
              reason: 'unknown',
            },
          ],
          { comments: true },
        ),
      ).toEqual([`DROP INDEX "IDX_test"; -- unknown`]);
    });
  });
});
