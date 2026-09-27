// Single source of truth lives in @statvision/common.
// This module re-exports it to prevent schema drift between api and worker.
export { EVENT_SCHEMA } from "@statvision/common";
