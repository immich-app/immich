## Analysis
### Why the combined query works and the split doesn't

Combined query ("portrait animal"): CLIP encodes this as a single vector that captures the intersection concept — animal portraits. The ANN index directly finds photos nearest to this unified meaning. CLIP was trained on full captions, so it understands multi-concept phrases natively.
Split query (query="portrait", contentFilter="animal"): Two completely separate things happen:

The ANN index scans in order of distance to "portrait" — so it returns the best portrait matches first. These are overwhelmingly people portraits, because that's the prototypical meaning.
Each candidate gets checked: is its distance to "animal" ≤ 0.78? That's cosine similarity ≥ 0.22, which is very loose. Lots of people portraits slip through because CLIP's similarity scores are noisy at that range.

Result: You see people portraits that happen to barely pass a loose animal check, rather than actual animal portraits.
When you swap (query="animal", contentFilter="portrait"), the ANN orders by "animal" first — so you get your cat, animal drawings, etc. The portrait threshold is again too loose to meaningfully filter, so non-portraits survive.
The core problem
The threshold approach has a fundamental issue: the ANN ordering is dominated by one embedding, and the threshold on the other is either too loose or too strict.

Too loose → unrelated results pass the filter (what you're seeing)
Too strict → almost nothing passes, because CLIP text-image similarities live in a narrow band (~0.20–0.45 cosine similarity) and there's no clean "match/no-match" boundary

This is why a single combined query like "portrait animal" outperforms the split — CLIP natively finds the intersection concept in one vector.
What to do about it
The most promising fix is to stop using the filter embedding as a hard threshold and instead incorporate it into the ranking. There are a few ways:

## Option A: Weighted distance ranking (simplest)
Instead of WHERE distance <= threshold, use a combined score in the ORDER BY:
sqlORDER BY
(1 - α) * (smart_search.embedding <=> query_embedding)
+ α * (smart_search.embedding <=> filter_embedding)
  With α = 0.3–0.5. This way photos that score well on both axes rise to the top, instead of ranking purely by one and filtering loosely by the other.
  The catch: this combined distance can't use the ANN index directly. But you can do retrieve-then-rerank:
  typescript// 1. ANN scan: get oversized candidate set ordered by query
  const candidates = await trx
  .selectFrom('smart_search')
  .where('assetId', 'in', /* metadata-filtered asset IDs */)
  .orderBy(sql`embedding <=> ${queryEmbedding}`)
  .limit(pagination.size * 20)  // oversample
  .execute();

// 2. Re-rank by combined score
// (done in SQL with a CTE, or post-process in TypeScript)
In SQL this could look like:
sqlWITH candidates AS (
SELECT asset.*, smart_search.embedding,
smart_search.embedding <=> $query AS query_dist,
smart_search.embedding <=> $filter AS filter_dist
FROM asset
JOIN smart_search ON asset.id = smart_search."assetId"
WHERE /* metadata filters */
ORDER BY smart_search.embedding <=> $query
LIMIT 2000
)
SELECT * FROM candidates
ORDER BY 0.6 * query_dist + 0.4 * filter_dist
LIMIT 100;


## My recommendation
Option A (weighted distance) is the smallest change from what you have, and it directly addresses the problem. The key insight is: replace WHERE distance <= threshold with incorporating the filter distance into ORDER BY. A slider for α (the weight between query and filter) is more intuitive for users than a threshold slider, and it degrades gracefully — α=0 means "ignore filter", α=1 means "filter is everything."

the existing slider for threshold can be changed into a slider for α.
