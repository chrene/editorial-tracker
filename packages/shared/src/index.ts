/**
 * Frontend-safe entry point: types and rules only, no database driver.
 * The Drizzle schema is published separately as `@editorial-tracker/shared/schema`
 * so importing domain rules here never pulls `drizzle-orm` into the browser bundle.
 */
export * from './types.js';
export * from './status.js';
export * from './permissions.js';
export * from './users.js';
