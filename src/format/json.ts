import type {
  CacheVersionState,
  IndexedModel,
  IndexedProvider,
  IndexDocument,
  RankedModelMatch,
  RankedProviderMatch,
  SyncResult,
} from "../data/types.js";

export type OutputFormat = "table" | "json";

export function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function providerSummaryToJson(provider: IndexedProvider) {
  return {
    id: provider.id,
    name: provider.name,
    display_name: provider.display_name,
    api: provider.api,
    doc: provider.doc,
    model_count: provider.model_count,
  };
}

export function modelSummaryToJson(model: IndexedModel) {
  return {
    provider_id: model.provider_id,
    provider_name: model.provider_name,
    provider_display_name: model.provider_display_name,
    model_id: model.model_id,
    model_name: model.model_name,
    model_display_name: model.model_display_name,
    type: model.type,
    input_modalities: model.input_modalities,
    output_modalities: model.output_modalities,
    cost_input: model.cost_input,
    cost_output: model.cost_output,
    cost_cache_read: model.cost_cache_read,
    context_limit: model.context_limit,
    output_limit: model.output_limit,
  };
}

export function modelToJson(model: IndexedModel) {
  return {
    provider_id: model.provider_id,
    provider_name: model.provider_name,
    provider_display_name: model.provider_display_name,
    provider_api: model.provider_api,
    provider_doc: model.provider_doc,
    model_id: model.model_id,
    model_name: model.model_name,
    model_display_name: model.model_display_name,
    type: model.type,
    attachment: model.attachment,
    reasoning_supported: model.reasoning_supported,
    reasoning_default: model.reasoning_default,
    tool_call: model.tool_call,
    temperature: model.temperature,
    vision: model.vision,
    open_weights: model.open_weights,
    knowledge: model.knowledge,
    release_date: model.release_date,
    last_updated: model.last_updated,
    input_modalities: model.input_modalities,
    output_modalities: model.output_modalities,
    cost_input: model.cost_input,
    cost_output: model.cost_output,
    cost_cache_read: model.cost_cache_read,
    context_limit: model.context_limit,
    output_limit: model.output_limit,
    metadata_description: model.metadata_description,
    metadata_features: model.metadata_features,
    metadata_type_hints: model.metadata_type_hints,
    raw: model.raw,
  };
}

export function modelMatchToJson(match: RankedModelMatch) {
  return {
    reason: match.reason,
    ...modelSummaryToJson(match.model),
  };
}

export function providerMatchToJson(match: RankedProviderMatch) {
  return {
    reason: match.reason,
    ...providerSummaryToJson(match.provider),
  };
}

export function capsToJson(model: IndexedModel) {
  return {
    provider_id: model.provider_id,
    provider_name: model.provider_name,
    provider_display_name: model.provider_display_name,
    model_id: model.model_id,
    model_name: model.model_name,
    model_display_name: model.model_display_name,
    type: model.type,
    input_modalities: model.input_modalities,
    output_modalities: model.output_modalities,
    attachment: model.attachment,
    reasoning_supported: model.reasoning_supported,
    reasoning_default: model.reasoning_default,
    tool_call: model.tool_call,
    temperature: model.temperature,
    vision: model.vision,
    open_weights: model.open_weights,
  };
}

export function costToJson(model: IndexedModel) {
  return {
    provider_id: model.provider_id,
    provider_name: model.provider_name,
    provider_display_name: model.provider_display_name,
    model_id: model.model_id,
    model_name: model.model_name,
    model_display_name: model.model_display_name,
    cost_input: model.cost_input,
    cost_output: model.cost_output,
    cost_cache_read: model.cost_cache_read,
  };
}

export function limitToJson(model: IndexedModel) {
  return {
    provider_id: model.provider_id,
    provider_name: model.provider_name,
    provider_display_name: model.provider_display_name,
    model_id: model.model_id,
    model_name: model.model_name,
    model_display_name: model.model_display_name,
    context_limit: model.context_limit,
    output_limit: model.output_limit,
  };
}

export function diffToJson(left: IndexedModel, right: IndexedModel) {
  return {
    left: modelSummaryToJson(left),
    right: modelSummaryToJson(right),
    comparison: {
      provider: { left: left.provider_id, right: right.provider_id },
      type: { left: left.type, right: right.type },
      input_modalities: { left: left.input_modalities, right: right.input_modalities },
      output_modalities: { left: left.output_modalities, right: right.output_modalities },
      reasoning_supported: { left: left.reasoning_supported, right: right.reasoning_supported },
      tool_call: { left: left.tool_call, right: right.tool_call },
      attachment: { left: left.attachment, right: right.attachment },
      temperature: { left: left.temperature, right: right.temperature },
      vision: { left: left.vision, right: right.vision },
      open_weights: { left: left.open_weights, right: right.open_weights },
      knowledge: { left: left.knowledge, right: right.knowledge },
      release_date: { left: left.release_date, right: right.release_date },
      last_updated: { left: left.last_updated, right: right.last_updated },
      cost_input: { left: left.cost_input, right: right.cost_input },
      cost_output: { left: left.cost_output, right: right.cost_output },
      cost_cache_read: { left: left.cost_cache_read, right: right.cost_cache_read },
      context_limit: { left: left.context_limit, right: right.context_limit },
      output_limit: { left: left.output_limit, right: right.output_limit },
    },
  };
}

export function doctorToJson(
  indexDocument: IndexDocument | undefined,
  versionState: CacheVersionState | undefined,
  paths: { dir: string; raw: string; version: string; index: string },
  stale: "yes" | "no" | "unknown",
) {
  return {
    cache_status: indexDocument ? "ready" : "missing",
    cache_dir: paths.dir,
    raw_path: paths.raw,
    version_path: paths.version,
    index_path: paths.index,
    local_updated_at: versionState?.local_updated_at,
    last_checked_at: versionState?.last_checked_at,
    cache_origin: versionState?.cache_origin,
    provider_count: indexDocument?.provider_count,
    model_count: indexDocument?.model_count,
    stale,
  };
}

export function updateToJson(result: SyncResult) {
  return {
    updated: result.updated,
    old_version: result.old_version,
    new_version: result.new_version,
    provider_count: result.provider_count,
    model_count: result.model_count,
    cache_origin: result.cache_origin,
  };
}
