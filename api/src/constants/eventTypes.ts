// Single source of truth lives in @statvision/common.
// This module re-exports it to prevent type drift between api and worker.
export { ALLOWED_EVENT_TYPES } from "@statvision/common";
export type { EventType } from "@statvision/common";
