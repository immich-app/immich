import { DateTime } from 'luxon';
import { AssetRepository } from 'src/repositories/asset.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { MemoryRule, MemoryRuleCandidate, MemoryRuleContext } from 'src/services/memory-rules/memory-rule.interface';

export class BirthdayMemoryRule implements MemoryRule {
  readonly id = 'birthday';

  constructor(
    private personRepository: Pick<PersonRepository, 'getBirthdaysForDay'>,
    private assetRepository: Pick<AssetRepository, 'getMemoryAssetsForPerson'>,
  ) {}

  async evaluate({ ownerId, target }: MemoryRuleContext): Promise<MemoryRuleCandidate[]> {
    const people = await this.personRepository.getBirthdaysForDay(ownerId, { month: target.month, day: target.day });
    const candidates: MemoryRuleCandidate[] = [];

    for (const person of people) {
      const assets = await this.assetRepository.getMemoryAssetsForPerson(
        ownerId,
        person.id,
        target.endOf('day').toJSDate(),
      );
      const byYear = new Map<number, string[]>();

      for (const asset of assets) {
        const year = DateTime.fromJSDate(asset.localDateTime, { zone: 'utc' }).year;
        const ids = byYear.get(year) ?? [];
        if (ids.length < 2) {
          ids.push(asset.id);
          byYear.set(year, ids);
        }
      }

      const assetIds = [...byYear.keys()]
        .toSorted((a, b) => b - a)
        .flatMap((year) => byYear.get(year) ?? [])
        .slice(0, 12);

      if (assetIds.length < 6 || byYear.size < 2) {
        continue;
      }

      candidates.push({
        ruleId: this.id,
        dedupeKey: `birthday:${person.id}:${target.toFormat('yyyy-MM-dd')}`,
        title: `Happy birthday, ${person.name}`,
        subtitle: 'Photos from different years',
        score: 100 + byYear.size * 10 + assetIds.length,
        assetIds,
        memoryAt: target,
        context: { personId: person.id, distinctYears: byYear.size },
      });
    }

    return candidates;
  }
}
