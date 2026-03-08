export type UnknownRecord = Record<string, unknown>;

export interface RawVersionFile extends UnknownRecord {
  updated_at: unknown;
}

export interface RawModel extends UnknownRecord {
  id?: unknown;
  name?: unknown;
  display_name?: unknown;
  type?: unknown;
  attachment?: unknown;
  reasoning?: unknown;
  tool_call?: unknown;
  temperature?: unknown;
  vision?: unknown;
  open_weights?: unknown;
  knowledge?: unknown;
  release_date?: unknown;
  last_updated?: unknown;
  modalities?: unknown;
  cost?: unknown;
  limit?: unknown;
  metadata?: unknown;
  features?: unknown;
  typeHints?: unknown;
}

export interface RawProvider extends UnknownRecord {
  id?: unknown;
  api?: unknown;
  name?: unknown;
  doc?: unknown;
  display_name?: unknown;
  models?: unknown;
  metadata?: unknown;
  updated_at?: unknown;
}

export interface RawDatasetEnvelope extends UnknownRecord {
  providers: RawProvider[] | Record<string, RawProvider>;
  updated_at?: unknown;
}

export type RawDataset = RawProvider[] | RawDatasetEnvelope;

export interface NormalizedProvider {
  id: string;
  name?: string;
  display_name?: string;
  api?: string;
  doc?: string;
  metadata?: UnknownRecord;
  model_count: number;
  raw: RawProvider;
}

export interface NormalizedModel {
  provider_id: string;
  provider_name?: string;
  provider_display_name?: string;
  provider_api?: string;
  provider_doc?: string;
  model_id: string;
  model_name?: string;
  model_display_name?: string;
  type?: string;
  attachment?: boolean;
  reasoning_supported?: boolean;
  reasoning_default?: boolean;
  tool_call?: boolean;
  temperature?: boolean;
  vision?: boolean;
  open_weights?: boolean;
  knowledge?: string;
  release_date?: string;
  last_updated?: string;
  input_modalities: string[];
  output_modalities: string[];
  cost_input?: number;
  cost_output?: number;
  cost_cache_read?: number;
  context_limit?: number;
  output_limit?: number;
  metadata_description?: string;
  metadata_features: string[];
  metadata_type_hints: string[];
  raw: RawModel;
}

export interface IndexedProvider extends NormalizedProvider {
  search_text: string;
  search_tokens: string[];
}

export interface IndexedModel extends NormalizedModel {
  search_text: string;
  search_tokens: string[];
}

export interface IndexLookup {
  by_model_id: Record<string, number[]>;
  by_display_name: Record<string, number[]>;
  by_name: Record<string, number[]>;
  by_provider_id: Record<string, number[]>;
  by_provider_name: Record<string, number[]>;
  by_provider_display_name: Record<string, number[]>;
}

export interface IndexDocument {
  schema_version: number;
  source_updated_at?: number;
  generated_at: number;
  provider_count: number;
  model_count: number;
  providers: IndexedProvider[];
  models: IndexedModel[];
  lookup: IndexLookup;
}

export interface CacheVersionState {
  schema_version: number;
  local_updated_at?: number;
  last_checked_remote_updated_at?: number;
  last_checked_at?: number;
  index_built_at?: number;
  cache_origin: "bundled" | "remote";
}

export interface NormalizeResult {
  providers: NormalizedProvider[];
  models: NormalizedModel[];
  source_updated_at?: number;
}

export type MatchReason =
  | "exact-model-id"
  | "exact-display-name"
  | "exact-name"
  | "prefix"
  | "substring"
  | "fuzzy";

export interface RankedModelMatch {
  model: IndexedModel;
  index: number;
  reason: MatchReason;
  sort_score: number;
  fuzzy_score?: number;
}

export interface RankedProviderMatch {
  provider: IndexedProvider;
  reason: Exclude<MatchReason, "exact-model-id">;
  sort_score: number;
}

export interface SyncResult {
  updated: boolean;
  old_version?: number;
  new_version: number;
  provider_count: number;
  model_count: number;
  cache_origin: "bundled" | "remote";
}
