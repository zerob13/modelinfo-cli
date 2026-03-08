import { z } from "zod";

import type { IndexDocument, RawDataset, RawVersionFile } from "./types.js";
import { INDEX_SCHEMA_VERSION } from "../core/config.js";

const timestampSchema = z.union([z.number(), z.string(), z.date()]);

const datasetEnvelopeSchema = z
  .object({
    providers: z.union([z.array(z.unknown()), z.record(z.unknown())]),
    updated_at: timestampSchema.optional(),
  })
  .passthrough();

export const versionFileSchema = z
  .object({
    updated_at: timestampSchema,
  })
  .passthrough();

export function parseVersionFile(value: unknown): RawVersionFile {
  return versionFileSchema.parse(value) as RawVersionFile;
}

export function parseDataset(value: unknown): RawDataset {
  if (Array.isArray(value)) {
    return value as RawDataset;
  }

  return datasetEnvelopeSchema.parse(value) as RawDataset;
}

export function parseIndexDocument(value: unknown): IndexDocument {
  const schema = z.object({
    schema_version: z.literal(INDEX_SCHEMA_VERSION),
    generated_at: z.number(),
    provider_count: z.number(),
    model_count: z.number(),
    providers: z.array(z.unknown()),
    models: z.array(z.unknown()),
    lookup: z.object({
      by_model_id: z.record(z.array(z.number())),
      by_display_name: z.record(z.array(z.number())),
      by_name: z.record(z.array(z.number())),
      by_provider_id: z.record(z.array(z.number())),
      by_provider_name: z.record(z.array(z.number())),
      by_provider_display_name: z.record(z.array(z.number())),
    }),
    source_updated_at: z.number().optional(),
  });

  return schema.parse(value) as IndexDocument;
}
