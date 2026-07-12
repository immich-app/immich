import { parse as parseExif } from 'exifr';

export interface GpanoTags {
  poseHeadingDegrees?: number;
  posePitchDegrees?: number;
  poseRollDegrees?: number;
  initialViewHeadingDegrees?: number;
  initialViewPitchDegrees?: number;
  initialViewRollDegrees?: number;
  initialHorizontalFovDegrees?: number;
}

export interface PannellumPoseConfig {
  northOffset?: number;
  horizonPitch?: number;
  horizonRoll?: number;
  yaw?: number;
  pitch?: number;
  hfov?: number;
  // Not a Pannellum viewer option - Pannellum has no initial-viewport-roll API, so this is
  // carried through for the adapter component to apply as a CSS transform instead.
  initialViewRollDegrees?: number;
}

/** Reads the GPano pose/initial-view XMP tags off an image blob. Never throws - a missing or
 * unparseable panorama tag set must not block the panorama from rendering. */
export async function readGpanoTags(blob: Blob): Promise<GpanoTags> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = (await parseExif(blob, { xmp: true })) ?? {};
    const tags: GpanoTags = {};
    if (typeof data.PoseHeadingDegrees === 'number') {
      tags.poseHeadingDegrees = data.PoseHeadingDegrees;
    }
    if (typeof data.PosePitchDegrees === 'number') {
      tags.posePitchDegrees = data.PosePitchDegrees;
    }
    if (typeof data.PoseRollDegrees === 'number') {
      tags.poseRollDegrees = data.PoseRollDegrees;
    }
    if (typeof data.InitialViewHeadingDegrees === 'number') {
      tags.initialViewHeadingDegrees = data.InitialViewHeadingDegrees;
    }
    if (typeof data.InitialViewPitchDegrees === 'number') {
      tags.initialViewPitchDegrees = data.InitialViewPitchDegrees;
    }
    if (typeof data.InitialViewRollDegrees === 'number') {
      tags.initialViewRollDegrees = data.InitialViewRollDegrees;
    }
    if (typeof data.InitialHorizontalFOVDegrees === 'number') {
      tags.initialHorizontalFovDegrees = data.InitialHorizontalFOVDegrees;
    }
    return tags;
  } catch {
    return {};
  }
}

const normalize360 = (degrees: number) => ((degrees % 360) + 360) % 360;

/** Maps GPano pose/initial-view tags to Pannellum viewer config, per the GPano spec's Euler
 * composition (see https://github.com/rodrigopolo/360GPanoReference): Pose tags position the
 * panorama texture on a static sphere; InitialView tags position the camera inside it. Pannellum
 * has horizonPitch/horizonRoll/northOffset primitives that reproject Pose at the texture level, so
 * unlike viewers without such primitives, only this direct mapping is needed (no full 3D
 * recomposition). */
export function gpanoTagsToPannellumConfig(tags: GpanoTags): PannellumPoseConfig {
  const config: PannellumPoseConfig = {};

  if (tags.poseHeadingDegrees !== undefined) {
    config.northOffset = tags.poseHeadingDegrees;
  }
  if (tags.posePitchDegrees !== undefined) {
    config.horizonPitch = tags.posePitchDegrees;
  }
  if (tags.poseRollDegrees !== undefined) {
    // Pannellum's horizonRoll rotates opposite the GPano PoseRollDegrees convention.
    config.horizonRoll = -tags.poseRollDegrees;
  }
  if (tags.initialViewHeadingDegrees !== undefined) {
    let yaw = normalize360(tags.initialViewHeadingDegrees - (tags.poseHeadingDegrees ?? 0));
    if (yaw > 180) {
      yaw -= 360;
    }
    config.yaw = yaw;
  }
  if (tags.initialViewPitchDegrees !== undefined) {
    config.pitch = tags.initialViewPitchDegrees;
  }
  if (tags.initialHorizontalFovDegrees !== undefined) {
    config.hfov = tags.initialHorizontalFovDegrees;
  }
  if (tags.initialViewRollDegrees !== undefined) {
    config.initialViewRollDegrees = tags.initialViewRollDegrees;
  }

  return config;
}

/** Minimal scale for a width x height rectangle, rotated by angleDegrees, to still fully cover its
 * own unrotated bounds (no corner gaps). Used to compensate for the CSS rotation applied to
 * Pannellum's render canvas for InitialViewRollDegrees, which has no native Pannellum option. */
export function computeRollCoverScale(width: number, height: number, angleDegrees: number): number {
  const radians = (angleDegrees * Math.PI) / 180;
  return Math.abs(Math.cos(radians)) + Math.max(width / height, height / width) * Math.abs(Math.sin(radians));
}
