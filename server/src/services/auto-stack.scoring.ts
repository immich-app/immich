// Shared scoring helper for AutoStackService
// NOTE: Keep in sync with AUTO_STACK_PLAN.md (UPDATE_REQUIRED on change)
export interface AutoStackScoringInputs {
  assets: Array<{
    id: string;
    originalFileName: string;
    dateTimeOriginal?: Date | null;
    iso?: number | null;
    exposureTime?: string | null;
    thumbhash?: Uint8Array | null;
    pHash?: string | null;
  }>;
  embeddingMap: Record<string, number[]>;
  weights: { size: number; timeSpan: number; continuity: number; visual: number; exposure: number };
  maxGapSeconds: number;
  windowSeconds: number;
}

export interface AutoStackScoreResult {
  total: number;
  components: Record<string, number>;
  avgCos?: number;
}

export function computeAutoStackScore({
  assets,
  embeddingMap,
  weights,
  maxGapSeconds,
  windowSeconds,
}: AutoStackScoringInputs): AutoStackScoreResult {
  const size = assets.length;
  const sizeScore = Math.min(1, Math.log2(size + 1) / 4) * (weights?.size ?? 50);
  const times = assets
    .map((s) => (s.dateTimeOriginal ? new Date(s.dateTimeOriginal).getTime() : NaN))
    .filter((t) => !Number.isNaN(t))
    .sort();
  const spanMs = times.length ? times[times.length - 1] - times[0] : 0;
  const idealSpanMs = maxGapSeconds * 1000 * (size - 1);
  const timeSpanScore =
    (spanMs <= idealSpanMs ? 1 : Math.max(0, 1 - (spanMs - idealSpanMs) / (windowSeconds * 1000))) *
    (weights?.timeSpan ?? 15);
  const suffix = (name: string) => name.match(/(\d+)(?=\.[^.]+$)/)?.[1] ?? '';
  const toNum = (s: string) => (s === '' ? NaN : Number.parseInt(s));
  let continuityOk = 0;
  for (let i = 1; i < assets.length; i++) {
    const prev = toNum(suffix(assets[i - 1].originalFileName));
    const cur = toNum(suffix(assets[i].originalFileName));
    if (!Number.isNaN(prev) && !Number.isNaN(cur) && (cur === prev || cur === prev + 1)) continuityOk++;
  }
  const continuityScore = (assets.length > 1 ? continuityOk / (assets.length - 1) : 0) * (weights?.continuity ?? 10);
  let visualSimilarityScore = 0;
  let avgCos: number | undefined;
  // Collect pHashes (normalized to 16-char hex) if present
  const pHashes = assets.map((a) => a.pHash?.toLowerCase()).filter((v): v is string => !!v && /^[0-9a-f]{16}$/.test(v));
  const haveAllPHash = pHashes.length === assets.length && assets.length > 1;
  const hamming = (a: string, b: string) => {
    let bits = 0;
    for (let i = 0; i < a.length; i++) {
      const x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
      bits += (x & 1) + ((x >> 1) & 1) + ((x >> 2) & 1) + ((x >> 3) & 1);
    }
    return bits; // number of differing bits (out of length*4)
  };
  const embAssets = assets.filter((s) => embeddingMap[s.id]);
  if (embAssets.length > 1) {
    let pairs = 0;
    let sumCos = 0;
    for (let i = 0; i < embAssets.length; i++) {
      const ei = embeddingMap[embAssets[i].id];
      const normI = Math.sqrt(ei.reduce((a, b) => a + b * b, 0));
      for (let j = i + 1; j < embAssets.length; j++) {
        const ej = embeddingMap[embAssets[j].id];
        const normJ = Math.sqrt(ej.reduce((a, b) => a + b * b, 0));
        if (!normI || !normJ) continue;
        let dot = 0;
        for (let k = 0; k < Math.min(ei.length, ej.length); k++) dot += ei[k] * ej[k];
        sumCos += dot / (normI * normJ);
        pairs++;
      }
    }
    avgCos = pairs ? sumCos / pairs : 0;
    let clipComponent = (avgCos + 1) / 2;
    if (haveAllPHash) {
      // Blend pHash similarity (average) with CLIP cosine; simple average for now (future: config weights)
      let hashPairs = 0;
      let hashSum = 0;
      const totalBits = 64; // 16 hex * 4 bits
      for (let i = 0; i < pHashes.length; i++) {
        for (let j = i + 1; j < pHashes.length; j++) {
          const diff = hamming(pHashes[i], pHashes[j]);
          hashSum += 1 - diff / totalBits;
          hashPairs++;
        }
      }
      const pHashAvg = hashPairs ? hashSum / hashPairs : 0;
      const blended = clipComponent * 0.7 + pHashAvg * 0.3;
      visualSimilarityScore = blended * (weights?.visual ?? 15);
    } else {
      visualSimilarityScore = clipComponent * (weights?.visual ?? 15);
    }
  } else {
    if (haveAllPHash) {
      let hashPairs = 0;
      let hashSum = 0;
      const totalBits = 64;
      for (let i = 0; i < pHashes.length; i++) {
        for (let j = i + 1; j < pHashes.length; j++) {
          const diff = hamming(pHashes[i], pHashes[j]);
          hashSum += 1 - diff / totalBits;
          hashPairs++;
        }
      }
      const pHashAvg = hashPairs ? hashSum / hashPairs : 0;
      visualSimilarityScore = pHashAvg * (weights?.visual ?? 15);
    } else {
      const thumbhashes = assets.map((s) => s.thumbhash).filter((t): t is Uint8Array => !!t && t.length >= 16);
      if (thumbhashes.length > 1) {
        let pairs = 0;
        let totalSim = 0;
        for (let i = 0; i < thumbhashes.length; i++) {
          for (let j = i + 1; j < thumbhashes.length; j++) {
            const a = thumbhashes[i];
            const b = thumbhashes[j];
            const len = Math.min(a.length, b.length, 16);
            let equalBits = 0;
            for (let k = 0; k < len; k++) {
              const x = a[k] ^ b[k];
              let diffBits = 0;
              for (let bit = 0; bit < 8; bit++) diffBits += (x >> bit) & 1;
              equalBits += 8 - diffBits;
            }
            totalSim += equalBits / (len * 8);
            pairs++;
          }
        }
        const avgSim = pairs ? totalSim / pairs : 0;
        visualSimilarityScore = avgSim * (weights?.visual ?? 15);
      }
    }
  }
  let exposureConsistencyScore = 0;
  const isoValues = assets.map((s) => s.iso).filter((v): v is number => typeof v === 'number');
  const exposureValues = assets.map((s) => s.exposureTime).filter((v): v is string => typeof v === 'string');
  const parseExposure = (v: string) =>
    v.includes('/')
      ? (() => {
          const [n, d] = v.split('/');
          const nn = Number(n);
          const dd = Number(d);
          return dd ? nn / dd : Number(v);
        })()
      : Number(v);
  const expNums = exposureValues.map(parseExposure).filter((v) => Number.isFinite(v) && v > 0);
  const variance = (arr: number[]) => {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((a, b) => a + (b - mean) ** 2, 0) / (arr.length - 1);
  };
  const normVar = (v: number) => (v === 0 ? 1 : 1 / (1 + v));
  if (isoValues.length > 1 || expNums.length > 1) {
    const isoScore = isoValues.length > 1 ? normVar(variance(isoValues)) : 1;
    const expScore = expNums.length > 1 ? normVar(variance(expNums)) : 1;
    exposureConsistencyScore = ((isoScore + expScore) / 2) * 10;
  }
  const rawTotal = sizeScore + timeSpanScore + continuityScore + visualSimilarityScore + exposureConsistencyScore;
  const total = Math.round(Math.min(100, rawTotal));
  return {
    total,
    components: {
      size: Math.round(sizeScore),
      timeSpan: Math.round(timeSpanScore),
      continuity: Math.round(continuityScore),
      visual: Math.round(visualSimilarityScore),
      exposure: Math.round(exposureConsistencyScore),
    },
    avgCos,
  };
}
