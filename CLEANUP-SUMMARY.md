# Project Cleanup Summary

This document summarizes the cleanup effort to remove unused files from the codebase.

## Cleanup Actions

The following files were identified as unused and removed from the project:

### Script Files
- `/Users/scott/dev/scr/scripts/test-performance.ts` - Referenced non-existent file
- `/Users/scott/dev/scr/scripts/test-position-decks.ts` - Referenced non-existent file

### Configuration Files
- `/Users/scott/dev/scr/.eslintrc.js` - Replaced by eslint.config.js
- `/Users/scott/dev/scr/sorceryCards.data.ts` - Duplicate data file

### Test Files
- `/Users/scott/dev/scr/tests/debug/debug-artifact-selection.js`
- `/Users/scott/dev/scr/tests/debug/debug-cards.js`
- `/Users/scott/dev/scr/tests/debug/quick-pattern-test.js`
- `/Users/scott/dev/scr/tests/debug/raw-threshold.ts`
- `/Users/scott/dev/scr/tests/debug/test-threshold.ts`
- `/Users/scott/dev/scr/tests/utility/simple-utility-test.js`
- `/Users/scott/dev/scr/tests/utility/utility-combo-test.js`
- `/Users/scott/dev/scr/tests/utility/find-utility-cards.js`
- `/Users/scott/dev/scr/tests/utility/check-utility-async.js`

### Completed Migration Documents
- `/Users/scott/dev/scr/FINAL-STATUS-COMPLETE.md`
- `/Users/scott/dev/scr/PROBABILITY-ANALYSIS-COMPLETE.md`
- `/Users/scott/dev/scr/REORGANIZATION-COMPLETE.md`
- `/Users/scott/dev/scr/SIMULATION-REORGANIZATION-COMPLETE.md`

## Package.json Changes

Removed the following npm scripts that referenced non-existent files:
- `test:position`
- `test:performance`

## Verification

All tests were run after cleanup to confirm that functionality was not affected.
- All 46 tests across 5 test files passed successfully.

## Additional Notes

This cleanup was performed on May 24, 2025 as part of ongoing maintenance to keep the codebase clean and manageable.
