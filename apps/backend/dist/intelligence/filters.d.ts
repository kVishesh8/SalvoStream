import { parseAndValidateInfoHash } from "../prowlarr/processor.js";
export interface FilterResult {
    isSpam: boolean;
    reason?: string;
}
/**
 * Deterministically checks if a release is junk, spam, or fake.
 * Ensures high safety without aggressive false positives on valid media titles.
 */
export declare function filterJunkRelease(title: string, magnetUrl?: string, directHash?: string): FilterResult;
export { parseAndValidateInfoHash };
//# sourceMappingURL=filters.d.ts.map