// Add this helper function file: /lib/reference-range-helper.ts

interface ReferenceRange {
  ageGroup: string;
  gender: string;
  minAge?: number;
  maxAge?: number;
  minValue: string;
  maxValue: string;
}

interface PatientDemographics {
  age: number | null;
  gender: string | null; // "Male", "Female", "Other"
}

/**
 * Determines the appropriate reference range based on patient age and gender
 * @param ranges Array of reference ranges
 * @param demographics Patient age and gender
 * @returns The appropriate reference range or null
 */
export function getApplicableReferenceRange(
  ranges: ReferenceRange[],
  demographics: PatientDemographics
): ReferenceRange | null {
  if (!ranges || ranges.length === 0) {
    return null;
  }

  const { age, gender } = demographics;

  // Helper function to check if age falls within a range
  const ageMatches = (range: ReferenceRange): boolean => {
    if (!age) return true; // If no age provided, consider it a match

    if (range.ageGroup === 'custom') {
      const minAge = range.minAge ?? 0;
      const maxAge = range.maxAge ?? 150;
      return age >= minAge && age <= maxAge;
    }

    // Predefined age groups
    switch (range.ageGroup) {
      case 'child':
        return age >= 0 && age <= 12;
      case 'teen':
        return age >= 13 && age <= 19;
      case 'adult':
        return age >= 20 && age <= 64;
      case 'senior':
        return age >= 65;
      default:
        return true;
    }
  };

  // Helper function to check if gender matches
  const genderMatches = (range: ReferenceRange): boolean => {
    if (!gender || range.gender === 'Any') return true;
    return range.gender === gender;
  };

  // Find exact match (both age and gender)
  const exactMatch = ranges.find(
    (range) => ageMatches(range) && genderMatches(range)
  );
  if (exactMatch) return exactMatch;

  // If no exact match, find age-only match with "Any" gender
  const ageOnlyMatch = ranges.find(
    (range) => ageMatches(range) && range.gender === 'Any'
  );
  if (ageOnlyMatch) return ageOnlyMatch;

  // If still no match, find gender-only match for "adult" age group
  if (age && age >= 20 && age <= 64) {
    const genderOnlyMatch = ranges.find(
      (range) => range.ageGroup === 'adult' && genderMatches(range)
    );
    if (genderOnlyMatch) return genderOnlyMatch;
  }

  // Last resort: return the first "Any" gender, "adult" age group
  const defaultRange = ranges.find(
    (range) => range.ageGroup === 'adult' && range.gender === 'Any'
  );
  if (defaultRange) return defaultRange;

  // If nothing matches, return the first range
  return ranges[0];
}

/**
 * Checks if a value is abnormal based on the reference range
 * @param value The test value
 * @param referenceRange The reference range to check against
 * @returns boolean indicating if the value is abnormal
 */
export function isAbnormal(
  value: string,
  referenceRange: ReferenceRange | null
): boolean {
  if (!value || !referenceRange) return false;

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;

  const minValue = parseFloat(referenceRange.minValue);
  const maxValue = parseFloat(referenceRange.maxValue);

  return numValue < minValue || numValue > maxValue;
}

/**
 * Gets the status of a test result (Low, Normal, High)
 * @param value The test value
 * @param referenceRange The reference range to check against
 * @returns "Low", "Normal", "High", or null
 */
export function getResultStatus(
  value: string,
  referenceRange: ReferenceRange | null
): 'Low' | 'Normal' | 'High' | null {
  if (!value || !referenceRange) return null;

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return null;

  const minValue = parseFloat(referenceRange.minValue);
  const maxValue = parseFloat(referenceRange.maxValue);

  if (numValue < minValue) return 'Low';
  if (numValue > maxValue) return 'High';
  return 'Normal';
}

/**
 * Formats the reference range for display
 * @param referenceRange The reference range
 * @returns Formatted string like "70 - 100"
 */
export function formatReferenceRange(
  referenceRange: ReferenceRange | null
): string {
  if (!referenceRange) return '-';
  return `${referenceRange.minValue} - ${referenceRange.maxValue}`;
}

/**
 * Gets a human-readable description of the reference range
 * @param referenceRange The reference range
 * @returns Description like "Adult Male" or "Child (0-12 years)"
 */
export function getRangeDescription(
  referenceRange: ReferenceRange | null
): string {
  if (!referenceRange) return '';

  const ageLabel =
    referenceRange.ageGroup === 'custom'
      ? `Ages ${referenceRange.minAge}-${referenceRange.maxAge}`
      : referenceRange.ageGroup.charAt(0).toUpperCase() +
        referenceRange.ageGroup.slice(1);

  const genderLabel =
    referenceRange.gender === 'Any' ? '' : ` (${referenceRange.gender})`;

  return `${ageLabel}${genderLabel}`;
}