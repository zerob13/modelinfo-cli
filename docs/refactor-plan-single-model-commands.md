# 重构计划：提取重复代码 - Single Model Commands

## 状态

- **状态**: 待实施
- **创建日期**: 2026-03-15
- **方案选择**: 方案 A（提取通用函数）
- **负责人**: @zerob13

---

## 目标

提取 `caps.ts`, `cost.ts`, `limit.ts` 中的重复逻辑，减少代码重复，提高可维护性。

---

## 当前问题分析

### 重复模式识别

三个文件（`caps.ts`, `cost.ts`, `limit.ts`）具有**完全相同的代码结构**：

```typescript
export async function runXxxCommand(
  modelQuery: string,
  options?: { provider?: string; output?: OutputFormat },
): Promise<void> {
  const resolution = await resolveModelQuery(modelQuery, options?.provider);
  const model = requireSingleModel(resolution);

  if (!model) {
    // 模式 A: 无匹配结果
    if (resolution.matches.length === 0) {
      if (options?.output === "json") {
        writeJson({ error: "MODEL_NOT_FOUND", query: modelQuery });
        process.exitCode = 1;
        return;
      }
      throw new ModelinfoError(`No model matched "${modelQuery}".`, "MODEL_NOT_FOUND");
    }

    // 模式 B: 多匹配结果
    if (options?.output === "json") {
      writeJson({
        query: modelQuery,
        count: resolution.matches.length,
        results: resolution.matches.map(modelMatchToJson),
      });
      process.exitCode = 1;
      return;
    }

    process.stdout.write(
      `${renderModelMatchesTable(resolution.matches, { includeReason: true })}\n`,
    );
    process.exitCode = 1;
    return;
  }

  // 模式 C: 单匹配成功
  if (options?.output === "json") {
    writeJson(xxxToJson(model)); // 唯一区别: 不同的 JSON 转换函数
    return;
  }

  process.stdout.write(`${renderXxxDetail(model)}\n`); // 唯一区别: 不同的渲染函数
}
```

### 差异点总结

| 文件       | JSON 转换函数 | 详情渲染函数        |
| ---------- | ------------- | ------------------- |
| `caps.ts`  | `capsToJson`  | `renderCapsDetail`  |
| `cost.ts`  | `costToJson`  | `renderCostDetail`  |
| `limit.ts` | `limitToJson` | `renderLimitDetail` |

**结论**：重复度约 **85%**，只有数据转换和渲染逻辑不同。

---

## 实施方案：方案 A

### 设计思路

在 `src/commands/shared.ts` 中新增通用执行器，通过策略接口注入差异逻辑。

### 接口设计

```typescript
// shared.ts 新增

export interface SingleModelHandler<T> {
  toJson: (model: IndexedModel) => T;
  renderDetail: (model: IndexedModel) => string;
  commandName: string; // 用于错误消息，如 "caps", "cost", "limit"
}

export async function runSingleModelCommand<T>(
  modelQuery: string,
  options: { provider?: string; output?: OutputFormat },
  handler: SingleModelHandler<T>,
): Promise<void> {
  const resolution = await resolveModelQuery(modelQuery, options.provider);
  const model = requireSingleModel(resolution);

  if (!model) {
    return handleModelNotFound(resolution, modelQuery, options.output);
  }

  if (options.output === "json") {
    writeJson(handler.toJson(model));
    return;
  }

  process.stdout.write(`${handler.renderDetail(model)}\n`);
}

async function handleModelNotFound(
  resolution: ModelResolution,
  query: string,
  output: OutputFormat | undefined,
): Promise<void> {
  if (resolution.matches.length === 0) {
    if (output === "json") {
      writeJson({ error: "MODEL_NOT_FOUND", query });
      process.exitCode = 1;
      return;
    }
    throw new ModelinfoError(`No model matched "${query}".`, "MODEL_NOT_FOUND");
  }

  if (output === "json") {
    writeJson({
      query,
      count: resolution.matches.length,
      results: resolution.matches.map(modelMatchToJson),
    });
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`${renderModelMatchesTable(resolution.matches, { includeReason: true })}\n`);
  process.exitCode = 1;
}
```

### 改造后的命令文件示例

```typescript
// caps.ts 改造后
import { runSingleModelCommand } from "./shared.js";
import { capsToJson } from "../format/json.js";
import { renderCapsDetail } from "../format/detail.js";

export async function runCapsCommand(
  modelQuery: string,
  options?: { provider?: string; output?: OutputFormat },
): Promise<void> {
  await runSingleModelCommand(modelQuery, options ?? {}, {
    toJson: capsToJson,
    renderDetail: renderCapsDetail,
    commandName: "caps",
  });
}
```

---

## 实施步骤

### Step 1: 扩展 `shared.ts`

- [ ] 添加 `SingleModelHandler` 接口
- [ ] 添加 `runSingleModelCommand` 函数
- [ ] 添加 `handleModelNotFound` 辅助函数
- [ ] 添加必要的 import 语句

### Step 2: 改造命令文件

- [ ] `caps.ts` → 使用 `runSingleModelCommand`
- [ ] `cost.ts` → 使用 `runSingleModelCommand`
- [ ] `limit.ts` → 使用 `runSingleModelCommand`

### Step 3: 验证

- [ ] 运行测试：`bun run test`
- [ ] 手动验证：`bun run dev caps gpt-4o`
- [ ] 检查 JSON 输出：`bun run dev caps gpt-4o --output json`
- [ ] 检查多匹配场景：`bun run dev caps gpt-4`
- [ ] 检查无匹配场景：`bun run dev caps nonexistent-model`

---

## 风险与回滚

| 风险         | 缓解措施                         |
| ------------ | -------------------------------- |
| 引入 Bug     | 保持函数签名不变，仅内部实现调整 |
| 测试覆盖不足 | 先运行现有测试，确保通过         |
| 类型错误     | TypeScript 编译检查              |

**回滚策略**：Git 回退到重构前 commit。

---

## 文件变更清单

| 文件                     | 变更类型 | 说明         |
| ------------------------ | -------- | ------------ |
| `src/commands/shared.ts` | 修改     | 添加通用函数 |
| `src/commands/caps.ts`   | 修改     | 简化实现     |
| `src/commands/cost.ts`   | 修改     | 简化实现     |
| `src/commands/limit.ts`  | 修改     | 简化实现     |

---

## 预期效果

### 代码量对比

| 文件        | 当前行数 | 改造后行数 | 减少     |
| ----------- | -------- | ---------- | -------- |
| `caps.ts`   | ~50      | ~15        | 70%      |
| `cost.ts`   | ~50      | ~15        | 70%      |
| `limit.ts`  | ~50      | ~15        | 70%      |
| `shared.ts` | ~60      | ~120       | +60      |
| **总计**    | **~210** | **~165**   | **~21%** |

### 维护性提升

- 统一错误处理逻辑
- 统一退出码处理
- 统一多匹配结果展示
- 新增类似命令时只需实现差异逻辑

---

## 备注

- 此重构保持对外接口完全兼容
- 不改变任何 CLI 行为
- 纯内部实现优化

---

_计划完成，等待实施确认。_
