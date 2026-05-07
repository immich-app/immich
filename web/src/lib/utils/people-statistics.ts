type FormatPeopleHeaderDescriptionOptions = {
  visiblePeopleCount: number;
  detectedFaceCount?: number | null;
  locale?: string;
  faceSingular: string;
  facePlural: string;
  includeFaceCount?: boolean;
  showZeroPeople?: boolean;
};

export const formatPeopleHeaderDescription = ({
  visiblePeopleCount,
  detectedFaceCount,
  locale,
  faceSingular,
  facePlural,
  includeFaceCount = true,
  showZeroPeople = false,
}: FormatPeopleHeaderDescriptionOptions): string | undefined => {
  if (visiblePeopleCount === 0 && !showZeroPeople) {
    return undefined;
  }

  const peopleText = `(${visiblePeopleCount.toLocaleString(locale)})`;
  if (!includeFaceCount || detectedFaceCount === null || detectedFaceCount === undefined) {
    return peopleText;
  }

  const faceLabel = detectedFaceCount === 1 ? faceSingular : facePlural;
  return `${peopleText} \u00B7 ${detectedFaceCount.toLocaleString(locale)} ${faceLabel}`;
};
