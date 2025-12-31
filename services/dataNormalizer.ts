/**
 * Data Normalization Service
 * 
 * Ensures data from API matches expected TypeScript interfaces.
 * Handles edge cases where API returns slightly different structures,
 * providing type safety and preventing runtime errors.
 * 
 * Features:
 * - Type-safe data transformation
 * - Graceful handling of missing/null fields
 * - Array validation and normalization
 * - Nested object structure validation
 * 
 * @module services/dataNormalizer
 */

import { PersonaBreakdown, ICPProfile } from '../types';

/**
 * Normalize a PersonaBreakdown object to ensure all required fields exist
 * 
 * Validates and transforms raw persona data from API into a type-safe
 * PersonaBreakdown object. Handles missing fields, type mismatches, and
 * invalid data gracefully.
 * 
 * @param persona - Raw persona data from API (may be incomplete or malformed)
 * @returns Normalized PersonaBreakdown object, or null if data is invalid
 * 
 * @example
 * ```typescript
 * const rawPersona = { personaName: 'John', ... };
 * const normalized = normalizePersonaBreakdown(rawPersona);
 * if (normalized) {
 *   // Use normalized persona safely
 * }
 * ```
 */
export const normalizePersonaBreakdown = (persona: unknown): PersonaBreakdown | null => {
  try {
    // Type guard: ensure persona is a non-null object
    if (!persona || typeof persona !== 'object' || Array.isArray(persona)) {
      console.warn('Invalid persona data: expected object, got', typeof persona);
      return null;
    }
    
    const personaObj = persona as Record<string, unknown>;

    // Helper function to safely convert to string array
    const toStringArray = (value: unknown, defaultValue: string[] = []): string[] => {
      if (!Array.isArray(value)) {
        return defaultValue;
      }
      return value
        .map((item) => String(item ?? ''))
        .filter((item) => item.length > 0);
    };
    
    // Helper function to safely get nested object property
    const getNestedString = (
      obj: Record<string, unknown>,
      path: string[],
      defaultValue: string
    ): string => {
      let current: unknown = obj;
      for (const key of path) {
        if (current && typeof current === 'object' && key in current) {
          current = (current as Record<string, unknown>)[key];
        } else {
          return defaultValue;
        }
      }
      return String(current ?? defaultValue);
    };
    
    // Helper function to safely get nested array
    const getNestedArray = (
      obj: Record<string, unknown>,
      path: string[],
      defaultValue: string[] = []
    ): string[] => {
      let current: unknown = obj;
      for (const key of path) {
        if (current && typeof current === 'object' && key in current) {
          current = (current as Record<string, unknown>)[key];
        } else {
          return defaultValue;
        }
      }
      return toStringArray(current, defaultValue);
    };
    
    const decisionMakingProcess = personaObj['decisionMakingProcess'] as Record<string, unknown> | undefined;
    
    // Ensure all required string fields exist with type-safe defaults
    const normalized: PersonaBreakdown = {
      personaName: String(personaObj['personaName'] ?? 'Persona'),
      personaTitle: String(personaObj['personaTitle'] ?? 'PROFESSIONAL'),
      buyerType: String(personaObj['buyerType'] ?? 'Buyer'),
      ageRange: String(personaObj['ageRange'] ?? 'N/A'),
      preferredCommunicationChannels: toStringArray(personaObj['preferredCommunicationChannels']),
      titles: toStringArray(personaObj['titles']),
      otherRelevantInfo: toStringArray(personaObj['otherRelevantInfo']),
      attributes: toStringArray(personaObj['attributes']),
      jobsToBeDone: toStringArray(personaObj['jobsToBeDone']),
      challenges: toStringArray(personaObj['challenges']),
      decisionMakingProcess: {
        research: {
          description: decisionMakingProcess
            ? getNestedString(decisionMakingProcess, ['research', 'description'], 'Research process description')
            : 'Research process description',
          sources: decisionMakingProcess
            ? getNestedArray(decisionMakingProcess, ['research', 'sources'])
            : []
        },
        evaluation: {
          description: decisionMakingProcess
            ? getNestedString(decisionMakingProcess, ['evaluation', 'description'], 'Evaluation process description')
            : 'Evaluation process description',
          factors: decisionMakingProcess
            ? getNestedArray(decisionMakingProcess, ['evaluation', 'factors'])
            : []
        },
        purchase: {
          description: decisionMakingProcess
            ? getNestedString(decisionMakingProcess, ['purchase', 'description'], 'Purchase process description')
            : 'Purchase process description',
          hesitations: decisionMakingProcess
            ? getNestedArray(decisionMakingProcess, ['purchase', 'hesitations'])
            : [],
          purchaseFactors: decisionMakingProcess
            ? getNestedArray(decisionMakingProcess, ['purchase', 'purchaseFactors'])
            : []
        }
      }
    };

    return normalized;
  } catch (error) {
    console.error('Error normalizing persona breakdown:', error);
    return null;
  }
};

/**
 * Normalize an array of PersonaBreakdown objects
 * 
 * Processes multiple persona objects, filtering out invalid entries
 * and returning only successfully normalized personas.
 * 
 * @param personas - Array of raw persona data from API
 * @returns Array of normalized PersonaBreakdown objects (invalid entries filtered out)
 * 
 * @example
 * ```typescript
 * const rawPersonas = [{ personaName: 'John' }, { invalid: true }];
 * const normalized = normalizePersonaBreakdowns(rawPersonas);
 * // Returns array with only valid personas
 * ```
 */
export const normalizePersonaBreakdowns = (personas: unknown[]): PersonaBreakdown[] => {
  // Type guard: ensure input is an array
  if (!Array.isArray(personas)) {
    console.warn('Persona breakdowns is not an array:', typeof personas);
    return [];
  }

  // Normalize each persona, filtering out invalid entries
  const normalized: PersonaBreakdown[] = [];
  for (const persona of personas) {
    const normalizedPersona = normalizePersonaBreakdown(persona);
    if (normalizedPersona !== null) {
      normalized.push(normalizedPersona);
    }
  }

  return normalized;
};

/**
 * Normalize an ICPProfile object to ensure all required fields exist
 * 
 * Validates and transforms raw ICP profile data from API into a type-safe
 * ICPProfile object. Handles missing fields, type mismatches, and nested
 * array structures gracefully.
 * 
 * @param profile - Raw ICP profile data from API (may be incomplete or malformed)
 * @returns Normalized ICPProfile object, or null if data is invalid
 * 
 * @example
 * ```typescript
 * const rawProfile = { useCaseFit: ['Enterprise'], ... };
 * const normalized = normalizeICPProfile(rawProfile);
 * if (normalized) {
 *   // Use normalized profile safely
 * }
 * ```
 */
export const normalizeICPProfile = (profile: unknown): ICPProfile | null => {
  try {
    // Type guard: ensure profile is a non-null, non-array object
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
      console.warn('Invalid ICP profile data: expected object, got', typeof profile);
      return null;
    }
    
    const profileObj = profile as Record<string, unknown>;
    
    // Helper function to safely convert to string array
    const toStringArray = (value: unknown, defaultValue: string[] = []): string[] => {
      if (!Array.isArray(value)) {
        return defaultValue;
      }
      return value
        .map((item) => String(item ?? ''))
        .filter((item) => item.length > 0);
    };
    
    // Normalize signals and attributes
    const signalsAndAttributes = Array.isArray(profileObj['signalsAndAttributes'])
      ? profileObj['signalsAndAttributes'].map((signal: unknown) => {
          if (!signal || typeof signal !== 'object' || Array.isArray(signal)) {
            return {
              category: 'Category',
              description: 'Description',
              triggerQuestion: undefined
            };
          }
          const signalObj = signal as Record<string, unknown>;
          return {
            category: String(signalObj['category'] ?? 'Category'),
            description: String(signalObj['description'] ?? 'Description'),
            triggerQuestion: signalObj['triggerQuestion'] ? String(signalObj['triggerQuestion']) : undefined
          };
        })
      : [];
    
    // Normalize title groups
    const titles = Array.isArray(profileObj['titles'])
      ? profileObj['titles'].map((titleGroup: unknown) => {
          if (!titleGroup || typeof titleGroup !== 'object' || Array.isArray(titleGroup)) {
            return {
              department: 'Department',
              roles: []
            };
          }
          const titleGroupObj = titleGroup as Record<string, unknown>;
          return {
            department: String(titleGroupObj['department'] ?? 'Department'),
            roles: toStringArray(titleGroupObj['roles'])
          };
        })
      : [];
    
    const normalized: ICPProfile = {
      useCaseFit: toStringArray(profileObj['useCaseFit']),
      signalsAndAttributes,
      titles,
      psychographics: toStringArray(profileObj['psychographics']),
      buyingTriggers: toStringArray(profileObj['buyingTriggers']),
      languagePatterns: toStringArray(profileObj['languagePatterns']),
      narrativeFrames: toStringArray(profileObj['narrativeFrames']),
      objections: toStringArray(profileObj['objections']),
      copyAngles: toStringArray(profileObj['copyAngles']),
      leadBehavioralPatterns: toStringArray(profileObj['leadBehavioralPatterns'])
    };

    return normalized;
  } catch (error) {
    console.error('Error normalizing ICP profile:', error);
    return null;
  }
};

