import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnEvent, OnJob } from 'src/decorators';
import { AssetType, JobName, JobStatus, QueueName, StackSource } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';

interface AutoStackCandidate {
  id: string;
  localDateTime: Date;
  make?: string | null;
  model?: string | null;
  orientation?: string | null;
  exifImageWidth?: number | null;
  exifImageHeight?: number | null;
  type?: string;
  iso?: number | null;
  fNumber?: number | null;
  rating?: number | null;
}

@Injectable()
export class AutoStackService extends BaseService {
  /**
   * Listen for metadata extraction completion and queue AutoStack job.
   * This mimics Google Photos' immediate grouping after upload.
   */
  @OnEvent({ name: 'AssetMetadataExtracted' })
  async onMetadataExtracted({ assetId }: ArgOf<'AssetMetadataExtracted'>) {
    const { machineLearning } = await this.getConfig({ withCache: true });
    
    if (!machineLearning.autoStack.enabled) {
      return;
    }

    // Queue the AutoStack job for this specific asset
    await this.jobRepository.queue({
      name: JobName.AssetAutoStack,
      data: { id: assetId },
    });
  }

  /**
   * Queue all assets for AutoStack processing (backfill).
   */
  @OnJob({ name: JobName.AssetAutoStackQueueAll, queue: QueueName.AutoStack })
  async handleQueueAutoStackAll({ force }: JobOf<JobName.AssetAutoStackQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });

    if (!machineLearning.autoStack.enabled) {
      return JobStatus.Skipped;
    }

    // If force=true, clear all AUTO stacks before reprocessing
    if (force) {
      this.logger.log('Force mode: Clearing all AUTO stacks before reprocessing');
      // Clear AUTO stacks for all users (undefined ownerId)
      const deleted = await this.stackRepository.deleteBySource(undefined, [
        StackSource.AutoBurst,
        StackSource.AutoTimeWindow,
      ]);
      this.logger.log(`Cleared ${deleted} AUTO stacks`);
    }

    // Wait for prerequisites to complete before processing
    this.logger.log('Waiting for CLIP embeddings (SmartSearch) and pHash computation (HashComputation) to complete...');
    await this.jobRepository.waitForQueueCompletion(QueueName.SmartSearch, QueueName.HashComputation);
    this.logger.log('Prerequisites complete, starting AutoStack processing');

    let jobs: JobItem[] = [];
    const queueBatch = async () => {
      if (jobs.length > 0) {
        await this.jobRepository.queueAll(jobs);
        jobs = [];
      }
    };

    // Use proper streaming method that filters by stackId at database level
    // Note: Always streams unstacked assets (force only affects whether we clear AUTO stacks first)
    const assets = this.assetJobRepository.streamForAutoStack();

    for await (const asset of assets) {
      // No need to check stackId - the query already filtered it
      jobs.push({ name: JobName.AssetAutoStack, data: { id: asset.id } });

      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await queueBatch();
      }
    }

    await queueBatch();
    return JobStatus.Success;
  }

  /**
   * Queue all assets for hash computation (backfill).
   * Hash computation is a prerequisite for pHash-based similarity detection.
   */
  @OnJob({ name: JobName.AssetComputeHashQueueAll, queue: QueueName.HashComputation })
  async handleQueueComputeHashAll({ force }: JobOf<JobName.AssetComputeHashQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });

    if (!machineLearning.autoStack.enabled) {
      return JobStatus.Skipped;
    }

    let jobs: JobItem[] = [];
    const queueBatch = async () => {
      if (jobs.length > 0) {
        await this.jobRepository.queueAll(jobs);
        jobs = [];
      }
    };

    // Use proper streaming method that filters by hash existence at database level
    // Note: When force=false, streams only images without hashes. When force=true, streams all images.
    const assets = this.assetJobRepository.streamForHashComputation(force ?? false);

    for await (const asset of assets) {
      jobs.push({ name: JobName.AssetComputeHash, data: { id: asset.id, force } });

      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await queueBatch();
      }
    }

    await queueBatch();
    return JobStatus.Success;
  }

  /**
   * Process a single asset for AutoStack - PHASE 1: Burst grouping only (immediate)
   * Groups photos with same EXIF burst ID immediately.
   * Queues phase 2 (time-window) for delayed processing.
   */
  @OnJob({ name: JobName.AssetAutoStack, queue: QueueName.AutoStack })
  async handleAutoStack({ id }: JobOf<JobName.AssetAutoStack>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    const config = machineLearning.autoStack;

    if (!config.enabled) {
      return JobStatus.Skipped;
    }

    const asset = await this.assetRepository.getById(id, { exifInfo: true });
    if (!asset || asset.stackId || asset.deletedAt) {
      return JobStatus.Skipped;
    }

    const exif = asset.exifInfo;
    let candidates: AutoStackCandidate[] = [];

    // PHASE 1: Try EXIF burst ID only (immediate, reliable grouping)
    if (config.preferBurstIds && exif?.autoStackId) {
      this.logger.debug(`[Phase 1] Checking burst ID ${exif.autoStackId} for asset ${id}`);
      candidates = await this.assetRepository.getCandidatesByBurstId(
        asset.ownerId,
        asset.libraryId,
        exif.autoStackId,
      );
    }

    // If we found burst candidates, create stack immediately
    if (candidates.length + 1 >= config.minAssets) {
      const allAssets = [asset, ...candidates];
      await this.createStackWithFallback('Phase 1', asset.ownerId, id, allAssets, StackSource.AutoBurst);
    }

    // PHASE 2: Queue delayed time-window grouping (allows more photos to upload)
    if (asset.localDateTime) {
      this.logger.debug(`[Phase 1] Queuing delayed time-window check for asset ${id} (delay: ${config.delaySeconds}s)`);
      await this.jobRepository.queue({
        name: JobName.AssetAutoStackTimeWindow,
        data: { id: asset.id, delay: config.delaySeconds * 1000 },
      });
    }

    return JobStatus.Success;
  }

  /**
   * Process a single asset for AutoStack - PHASE 2: Time-window grouping (delayed)
   * Groups similar photos by time window + visual similarity.
   * Runs after delaySeconds to allow more photos to upload first.
   */
  @OnJob({ name: JobName.AssetAutoStackTimeWindow, queue: QueueName.AutoStack })
  async handleAutoStackTimeWindow({ id }: JobOf<JobName.AssetAutoStackTimeWindow>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    const config = machineLearning.autoStack;

    if (!config.enabled) {
      return JobStatus.Skipped;
    }

    const asset = await this.assetRepository.getById(id, { exifInfo: true });
    if (!asset || asset.stackId || asset.deletedAt) {
      return JobStatus.Skipped;
    }

    if (!asset.localDateTime) {
      return JobStatus.Skipped;
    }

    const exif = asset.exifInfo;
    this.logger.debug(`[Phase 2] Checking time window (±${config.timeWindowSeconds}s) for asset ${id}`);
    
    // Prepare device filter (if requireSameDevice is enabled)
    const deviceFilter = (config.requireSameDevice && (exif?.make || exif?.model))
      ? { make: exif.make || undefined, model: exif.model || undefined }
      : undefined;

    const candidates = await this.assetRepository.getCandidatesByTimeWindow(
      asset.ownerId,
      asset.libraryId,
      asset.localDateTime,
      config.timeWindowSeconds,
      deviceFilter,
      exif?.orientation,
      config.requireSameOrientation,
    );

    if (candidates.length === 0) {
      this.logger.debug(`[Phase 2] No time-window candidates found for asset ${id}`);
      return JobStatus.Skipped;
    }

    // Log constraint filtering results
    const afterDeviceFilter = deviceFilter ? candidates.filter((c: AutoStackCandidate) => {
      if (deviceFilter.make && c.make !== deviceFilter.make) return false;
      if (deviceFilter.model && c.model !== deviceFilter.model) return false;
      return true;
    }).length : candidates.length;

    const afterOrientationFilter = config.requireSameOrientation ? candidates.filter((c: AutoStackCandidate) => {
      if (exif?.orientation === null) return c.orientation === null;
      return c.orientation === exif?.orientation;
    }).length : candidates.length;

    this.logger.log(
      `[Phase 2] Constraint filtering: ${candidates.length} candidates → ` +
      `${afterDeviceFilter} after device filter → ` +
      `${afterOrientationFilter} after orientation filter`,
    );

    // Filter by visual similarity
    const filtered = await this.filterByVisualSimilarity(id, asset.ownerId, candidates, config);
    const uniqueCandidates = Array.from(
      new Map(filtered.map((c) => [c.id, c])).values(),
    ).filter((c) => c.id !== id);

    // Apply pairwise outlier filtering to remove dissimilar images
    const allCandidatesPreFilter = [asset, ...uniqueCandidates];
    const allCandidatesFiltered = await this.filterOutliersByPairwiseSimilarity(
      allCandidatesPreFilter,
      asset.ownerId,
      config,
    );

    if (!allCandidatesFiltered.find((c) => c.id === id)) {
      this.logger.debug(`[Phase 2] Asset ${id} not found in filtered candidates, skipping stacking`);
      return JobStatus.Skipped;
    }

    // Remove the target asset from filtered list to get final candidates
    const finalCandidates = allCandidatesFiltered.filter((c) => c.id !== id);

    this.logger.debug(
      `[Phase 2] Outlier filtering: ${allCandidatesPreFilter.length} assets → ${allCandidatesFiltered.length} after removal`
    );
        

    // Ensure minimum stack size
    if (finalCandidates.length + 1 < config.minAssets) {
      this.logger.debug(
        `[Phase 2] Insufficient candidates after outlier filtering for asset ${id}: ${finalCandidates.length + 1} < ${config.minAssets}`
      );
      return JobStatus.Skipped;
    }

    // Check if asset is already in a stack (may have been grouped by Phase 1 or another process)
    const updatedAsset = await this.assetRepository.getById(id);
    if (updatedAsset?.stackId) {
      this.logger.debug(`[Phase 2] Asset ${id} already in stack, skipping`);
      return JobStatus.Skipped;
    }

    // Create the stack
    const allAssets = [asset, ...uniqueCandidates];
    const success = await this.createStackWithFallback('Phase 2', asset.ownerId, id, allAssets, StackSource.AutoTimeWindow);
    return success ? JobStatus.Success : JobStatus.Failed;
  }

  /**
   * Compute perceptual hashes for a single asset.
   * This enables pHash-based similarity detection for AutoStack.
   * Uses sharp-phash to compute 64-bit binary perceptual hash from image preview/thumbnail.
   */
  @OnJob({ name: JobName.AssetComputeHash, queue: QueueName.HashComputation })
  async handleComputeHash({ id, force }: JobOf<JobName.AssetComputeHash>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });

    if (!machineLearning.autoStack.enabled) {
      return JobStatus.Skipped;
    }

    try {
      // Fetch asset with file information
      const asset = await this.assetRepository.getById(id, { exifInfo: false });
      if (!asset) {
        this.logger.warn(`[pHash] Asset ${id} not found, skipping hash computation`);
        return JobStatus.Skipped;
      }

      // Only compute hashes for images
      if (asset.type !== AssetType.Image) {
        this.logger.debug(`[pHash] Asset ${id} is not an image (type: ${asset.type}), skipping`);
        return JobStatus.Skipped;
      }

      // Check if hash already exists (only skip if force=false)
      if (!force) {
        const existingHash = await this.assetHashRepository.getByAssetId(id);
        if (typeof existingHash?.phash === 'string' && existingHash.phash.length === 64) {
          this.logger.debug(`[pHash] Asset ${id} already has pHash, skipping recomputation`);
          return JobStatus.Skipped;
        }
      }

      // Get the best image file for hashing (Preview > Thumbnail > Original)
      const imagePath = await this.getImageFileForHashing(asset);
      if (!imagePath) {
        this.logger.warn(`[pHash] Could not find hashable image file for asset ${id}`);
        return JobStatus.Skipped;
      }

      // Compute pHash
      this.logger.debug(`[pHash] Computing pHash for asset ${id} from ${imagePath}`);
      const phashBinary = await this.computePhash(imagePath);

      if (!phashBinary) {
        this.logger.warn(`[pHash] Failed to compute pHash for asset ${id}`);
        return JobStatus.Skipped;
      }

      // Store binary string in database (256 characters for BIT(256))
      await this.assetHashRepository.upsert({
        assetId: id,
        phash: phashBinary,
      });

      this.logger.debug(`[pHash] Successfully computed and stored pHash for asset ${id}`);
      return JobStatus.Success;
    } catch (error) {
      this.logger.error(`[pHash] Error computing hash for asset ${id}: ${error}`);
      return JobStatus.Failed;
    }
  }

  /**
   * Select the best image file for pHash computation.
   * Priority: Preview > Thumbnail > Original
   * Returns file path or null if no suitable file found.
   */
  private async getImageFileForHashing(asset: any): Promise<string | null> {
    // Try to get preview file first (optimized and consistent)
    if (asset.previewPath) {
      return asset.previewPath;
    }

    // Fallback to thumbnail
    if (asset.thumbnailPath) {
      return asset.thumbnailPath;
    }

    // Last resort: original file
    if (asset.originalPath) {
      return asset.originalPath;
    }

    return null;
  }

  /**
   * Compute DCT-based pHash (perceptual hash) for an image file.
   * Uses standard 64-bit pHash algorithm with 2D Discrete Cosine Transform.
   * - Resize to 32x32 (standard size for pHash)
   * - Apply DCT and extract top-left 8x8 coefficients (lowest frequencies)
   * - Skip DC component, use remaining 63 coefficients + 1 padding = 64-bit hash
   * Returns 64-bit binary hash as a string (64 characters of '0' and '1').
   * Returns null if computation fails.
   */
  private async computePhash(imagePath: string): Promise<string | null> {
    try {
      // Standard pHash: resize to 32x32
      // Use 'fill' (stretch) - DCT is insensitive to minor aspect ratio distortions
      const resized = await sharp(imagePath)
        .resize(32, 32, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer();

      // Convert buffer to 2D array (32x32)
      const pixels: number[][] = [];
      for (let y = 0; y < 32; y++) {
        pixels[y] = [];
        for (let x = 0; x < 32; x++) {
          pixels[y][x] = resized[y * 32 + x];
        }
      }

      // Apply 2D DCT
      const { dct } = await import('@swnb/dct');
      const dctCoeffs = dct(pixels);

      // Extract top-left 8x8 DCT coefficients (skip DC component at [0,0])
      // This captures only the lowest frequencies (gross structure), ignoring fine details
      const lowFreqs: number[] = [];
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          if (y !== 0 || x !== 0) {
            // Skip DC component
            lowFreqs.push(dctCoeffs[y][x]);
          }
        }
      }

      // Calculate mean (average) of the 63 coefficients - standard pHash uses mean
      const mean = lowFreqs.reduce((sum, val) => sum + val, 0) / lowFreqs.length;

      // Binarize: 1 if coefficient > mean, 0 otherwise
      let hash = '';
      for (const coeff of lowFreqs) {
        hash += coeff > mean ? '1' : '0';
      }

      // Pad to 64 bits (63 coefficients + 1 padding bit)
      hash += '0';

      return hash;
    } catch (error) {
      this.logger.debug(`[pHash] Failed to compute DCT-based hash for ${imagePath}: ${error}`);
      return null;
    }
  }

  /**
   * Filter candidates by visual similarity using CLIP and/or pHash.
   * Google Photos uses visual analysis to avoid grouping different scenes.
   * 
   * Logic:
   * - If both CLIP and pHash are enabled: both must match (AND)
   * - If only CLIP is enabled: CLIP must match
   * - If only pHash is enabled: pHash must match
   * - If neither is enabled: return all candidates (timing is sufficient)
   */
  private async filterByVisualSimilarity(
    assetId: string,
    ownerId: string,
    candidates: AutoStackCandidate[],
    config: { clipMaxDistance: number; phashMinMatch: number },
  ): Promise<AutoStackCandidate[]> {
    const candidateIds = candidates.map((c) => c.id);
    const bothEnabled = config.clipMaxDistance > 0 && config.phashMinMatch > 0;
    const clipEnabled = config.clipMaxDistance > 0;
    const phashEnabled = config.phashMinMatch > 0;

    if (!clipEnabled && !phashEnabled) {
      return candidates;
    }

    let clipMatches: Set<string> | null = null;
    let phashMatches: Set<string> | null = null;

    // Check CLIP similarity
    if (clipEnabled) {
      try {
        const embedding = await this.searchRepository.getEmbedding(assetId);
        if (embedding?.embedding) {
          const { items } = await this.searchRepository.searchSmart(
            { page: 1, size: candidateIds.length },
            {
              embedding: embedding.embedding,
              userIds: [ownerId],
              withStacked: false,
            },
          );

          clipMatches = new Set(items.map((item: any) => item.id));
          this.logger.debug(`[Visual] CLIP: ${clipMatches.size}/${candidateIds.length} matches`);
        }
      } catch (error) {
        this.logger.debug(`[Visual] CLIP failed: ${error}`);
        clipMatches = new Set();
      }
    }

    // Check pHash similarity
    if (phashEnabled) {
      try {
        const hash = await this.assetHashRepository.getByAssetId(assetId);
        if (hash?.phash) {
          // Convert minMatch (0-1) to maxDistance (0-64)
          const maxDistance = Math.floor(64 * (1 - config.phashMinMatch));
          const similarByPhash = await this.assetHashRepository.findSimilarByPhash(
            assetId,
            hash.phash,
            maxDistance,
            candidateIds,
          );

          phashMatches = new Set(similarByPhash.map((s: any) => s.assetId));
          this.logger.debug(`[Visual] pHash: ${phashMatches.size}/${candidateIds.length} matches (minMatch: ${config.phashMinMatch})`);
        }
      } catch (error) {
        this.logger.debug(`[Visual] pHash failed: ${error}`);
        phashMatches = new Set();
      }
    }

    // Apply filtering logic based on what's enabled
    let resultIds: Set<string>;

    if (bothEnabled && clipMatches && phashMatches) {
      // Both enabled: intersection (AND logic)
      resultIds = new Set([...clipMatches].filter((id) => phashMatches!.has(id)));
      this.logger.debug(`[Visual] Combined: ${resultIds.size}/${candidateIds.length} pass both CLIP+pHash`);
    } else if (clipMatches !== null) {
      // Only CLIP enabled or CLIP was checked
      resultIds = clipMatches;
    } else if (phashMatches !== null) {
      // Only pHash enabled or pHash was checked
      resultIds = phashMatches;
    } else {
      // Neither filter produced results, return all candidates
      return candidates;
    }

    // Return candidates that passed the filter
    return candidates.filter((c) => resultIds.has(c.id));
  }

  /**
   * Filter out outliers from candidates using pairwise pHash similarity analysis.
   * An asset is considered an outlier if it's not similar to enough other candidates.
   *
   * Algorithm (median-based relative similarity):
   * 1. Fetch all pHash values upfront
   * 2. Calculate ALL pairwise Hamming distances locally
   * 3. Compute median distance of all pairs
   * 4. For each candidate: ratio = (distances ≤ median) / (total - 1)
   * 5. Remove candidates below the outlierSimilarityThreshold
   *
   * This is adaptive - the threshold adjusts to each group's actual variation.
   * Prevents transitive grouping where A→B and A→C but B≠C.
   */
  private async filterOutliersByPairwiseSimilarity(
    allCandidates: AutoStackCandidate[],
    ownerId: string,
    config: {
      phashMinMatch: number;
      outlierSimilarityThreshold: number;
    },
  ): Promise<AutoStackCandidate[]> {
    if (allCandidates.length < 3) {
      // With fewer than 3 candidates, pairwise filtering doesn't make sense
      return allCandidates;
    }

    this.logger.debug(`[Outlier] Analyzing ${allCandidates.length} candidates (threshold: ${config.outlierSimilarityThreshold})`);

    // Step 1: Fetch all pHash values upfront
    const hashMap = new Map<string, string>();
    for (const candidate of allCandidates) {
      const hash = await this.assetHashRepository.getByAssetId(candidate.id);
      if (hash?.phash) {
        hashMap.set(candidate.id, hash.phash);
      }
    }

    if (hashMap.size < 2) {
      this.logger.warn('[Outlier] Not enough pHash values, skipping');
      return allCandidates;
    }

    // Step 2: Calculate ALL pairwise match ratios locally
    const allMatchRatios: number[] = [];
    const pairwiseMatches = new Map<string, Map<string, number>>();

    for (let i = 0; i < allCandidates.length; i++) {
      const candidateA = allCandidates[i];
      const hashA = hashMap.get(candidateA.id);
      if (!hashA) continue;

      pairwiseMatches.set(candidateA.id, new Map());

      for (let j = i + 1; j < allCandidates.length; j++) {
        const candidateB = allCandidates[j];
        const hashB = hashMap.get(candidateB.id);
        if (!hashB) continue;

        // Calculate match ratio (0-1): 1 = identical, 0 = completely different
        const distance = this.calculateHammingDistance(hashA, hashB);
        const matchRatio = (64 - distance) / 64;
        allMatchRatios.push(matchRatio);

        // Store both directions
        pairwiseMatches.get(candidateA.id)!.set(candidateB.id, matchRatio);
        if (!pairwiseMatches.has(candidateB.id)) {
          pairwiseMatches.set(candidateB.id, new Map());
        }
        pairwiseMatches.get(candidateB.id)!.set(candidateA.id, matchRatio);
      }
    }

    if (allMatchRatios.length === 0) {
      this.logger.warn('[Outlier] No pairwise matches calculated, skipping');
      return allCandidates;
    }

    // Step 3: Compute median match ratio
    const sortedMatches = [...allMatchRatios].sort((a, b) => a - b);
    const medianMatch = sortedMatches[Math.floor(sortedMatches.length / 2)];

    this.logger.debug(`[Outlier] Match ratios: min=${sortedMatches[0].toFixed(2)}, median=${medianMatch.toFixed(2)}, max=${sortedMatches[sortedMatches.length - 1].toFixed(2)}`);

    // Step 4: For each candidate, calculate ratio of matches ≥ median
    const similarityScores = new Map<string, number>();

    for (const candidate of allCandidates) {
      const matches = pairwiseMatches.get(candidate.id);

      if (!matches || matches.size === 0) {
        similarityScores.set(candidate.id, 0);
        continue;
      }

      let aboveMedianCount = 0;
      const matchDetails: string[] = [];

      for (const [otherId, matchRatio] of matches) {
        const aboveMedian = matchRatio >= medianMatch;
        if (aboveMedian) {
          aboveMedianCount++;
        }
        matchDetails.push(`${otherId.substring(0, 8)}:${matchRatio.toFixed(2)}${aboveMedian ? '✓' : ''}`);
      }

      const similarityRatio = aboveMedianCount / matches.size;
      similarityScores.set(candidate.id, similarityRatio);

      this.logger.debug(`[Outlier] ${candidate.id.substring(0, 8)}: ${aboveMedianCount}/${matches.size} ≥ median = ${similarityRatio.toFixed(2)} [${matchDetails.join(', ')}]`);
    }

    // Step 5: Filter out candidates below the threshold
    const filtered = allCandidates.filter((c) => {
      const ratio = similarityScores.get(c.id) || 0;
      const keep = ratio >= config.outlierSimilarityThreshold;

      if (!keep) {
        this.logger.debug(`[Outlier] Removing ${c.id.substring(0, 8)}: ${ratio.toFixed(2)} < ${config.outlierSimilarityThreshold}`);
      }

      return keep;
    });

    this.logger.debug(`[Outlier] Kept ${filtered.length}/${allCandidates.length}`);

    return filtered;
  }

  /**
   * Calculate Hamming distance between two binary hash strings.
   * Counts the number of positions where the bits differ.
   */
  private calculateHammingDistance(hashA: string, hashB: string): number {
    let distance = 0;
    const len = Math.min(hashA.length, hashB.length);
    for (let i = 0; i < len; i++) {
      if (hashA[i] !== hashB[i]) {
        distance++;
      }
    }
    return distance;
  }

  /**
   * Prepare asset IDs for stack creation with best primary asset selected.
   * Always selects the highest quality asset as primary, based on comprehensive quality metrics.
   * Logs quality scores for debugging.
   * 
   * Returns array with primary asset first, followed by others.
   */
  private prepareStackAssetIds(allAssets: AutoStackCandidate[], phase: 'Phase 1' | 'Phase 2'): string[] {
    const primaryAsset = this.selectPrimaryAsset(allAssets);

    // Log quality scores for debugging
    const scores = allAssets.map((a) => ({
      id: a.id.substring(0, 8),
      score: this.calculateQualityScore(a).toFixed(1),
    }));
    this.logger.debug(
      `[${phase}] Quality scores: ${scores.map((s) => `${s.id}=${s.score}`).join(', ')} → Selected ${primaryAsset.id.substring(0, 8)}`,
    );

    return [primaryAsset.id, ...allAssets.filter((a) => a.id !== primaryAsset.id).map((a) => a.id)];
  }

  /**
   * Create a stack with the given assets, handling unique constraint violations.
   * Always selects the best quality asset as primary.
   * If the selected primary asset is already primary of another stack,
   * tries selecting a fallback primary and retrying.
   * 
   * The stack.create() method will merge overlapping stacks automatically.
   */
  private async createStackWithFallback(
    phase: 'Phase 1' | 'Phase 2',
    ownerId: string,
    assetId: string,
    allAssets: AutoStackCandidate[],
    source: string,
  ): Promise<boolean> {
    // Prepare asset IDs with best primary asset selected
    let assetIds = this.prepareStackAssetIds(allAssets, phase);
    const primaryAssetId = assetIds[0];

    this.logger.log(`[${phase}] Creating stack for ${assetIds.length} assets with primary ${primaryAssetId}`);

    try {
      await this.stackRepository.create({ ownerId, source }, assetIds);
      this.logger.log(`[${phase}] Successfully created stack for asset ${assetId}`);
      return true;
    } catch (error) {
      // Handle unique constraint violation: primary asset is already primary of another stack
      if (
        error instanceof Error &&
        error.message?.includes('duplicate key value violates unique constraint "stack_primaryAssetId_uq"')
      ) {
        this.logger.debug(
          `[${phase}] Primary asset ${primaryAssetId} is already primary of another stack. ` +
          `Attempting to find alternative primary and merge.`,
        );

        // Try selecting a different primary from remaining assets
        const fallbackAssets = allAssets.filter((a) => a.id !== primaryAssetId);
        if (fallbackAssets.length > 0) {
          // Use helper to select best from fallback assets
          assetIds = this.prepareStackAssetIds(fallbackAssets, phase);
          const fallbackPrimaryId = assetIds[0];

          this.logger.log(
            `[${phase}] Retrying with fallback primary ${fallbackPrimaryId} for ${assetIds.length} assets`,
          );

          try {
            await this.stackRepository.create({ ownerId, source }, assetIds);
            this.logger.log(`[${phase}] Successfully created stack with fallback primary for asset ${assetId}`);
            return true;
          } catch (fallbackError) {
            this.logger.error(`[${phase}] Fallback stack creation failed for asset ${assetId}: ${fallbackError}`);
            return false;
          }
        }
      }

      this.logger.error(`[${phase}] Failed to create stack for asset ${assetId}: ${error}`);
      return false;
    }
  }

  /**
   * Calculate image quality score based on Google Photos criteria.
   * Combines multiple quality metrics into a 0-100 score.
   * 
   * Scoring breakdown:
   * - Resolution (40%): Higher pixel count = better
   * - ISO (30%): Lower ISO = less noise = better
   * - Aperture (15%): Wider aperture (lower f-number) = more light = better
   * - Metadata completeness (10%): Presence of camera info
   * - User rating (5%): Manual rating if set
   */
  private calculateQualityScore(asset: AutoStackCandidate): number {
    let score = 0;

    // Resolution (weight: 40%)
    // Normalize to typical 4K (12M pixels = 4000x3000)
    const pixels = (asset.exifImageWidth || 0) * (asset.exifImageHeight || 0);
    const resolutionScore = Math.min(pixels / 12_000_000, 1) * 40;
    score += resolutionScore;

    // ISO (weight: 30%)
    // Lower ISO is better (less noise)
    // Normalize: ISO 100 = 30pts, ISO 3200 = ~0pts
    const iso = asset.iso || 400;
    const isoScore = Math.max(0, 30 - (iso - 100) / 104); // 104 = (3200-100)/30
    score += isoScore;

    // Aperture (weight: 15%)
    // Lower f-number (wider aperture) is better
    // f/1.4 = 15pts, f/16 = ~0pts
    const fNumber = asset.fNumber || 5.6;
    const apertureScore = Math.max(0, 15 - fNumber * 1.5);
    score += apertureScore;

    // Metadata completeness (weight: 10%)
    // Reward images with complete camera information
    if (asset.make && asset.model) {
      score += 10;
    }

    // User rating (weight: 5%)
    // If user has manually rated the image
    if (asset.rating && asset.rating > 0) {
      score += Math.min(asset.rating, 5); // Max 5 points for 5-star rating
    }

    return Math.min(score, 100);
  }

  /**
   * Select the primary asset for the stack.
   * Google Photos selects based on comprehensive quality metrics.
   * Breaks ties using earliest timestamp.
   */
  private selectPrimaryAsset(assets: AutoStackCandidate[]): AutoStackCandidate {
    return assets.reduce((best, current) => {
      const bestScore = this.calculateQualityScore(best);
      const currentScore = this.calculateQualityScore(current);

      // Higher quality score wins
      if (currentScore > bestScore) {
        return current;
      }

      // On tie, earliest timestamp wins
      if (currentScore === bestScore && current.localDateTime < best.localDateTime) {
        return current;
      }

      return best;
    });
  }
}
