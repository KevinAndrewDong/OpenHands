import type {
  MetricsSnapshot,
  RuntimeConversationInfo,
  RuntimeConversationStats,
  TokenUsage,
} from "#/api/conversation-service/agent-server-conversation-service.types";
import type { MetricsState } from "#/stores/metrics-store";

/**
 * TypeScript equivalent of the get_combined_metrics method from the Python SDK
 * Combines metrics from all LLM usage IDs in a conversation's stats
 */
export function combineUsageMetrics(
  stats: RuntimeConversationStats | null | undefined,
): MetricsSnapshot {
  if (!stats?.usage_to_metrics) {
    return {
      accumulated_cost: 0,
      max_budget_per_task: null,
      accumulated_token_usage: null,
    };
  }

  let totalCost = 0;
  let maxBudgetPerTask: number | null = null;
  let combinedTokenUsage: TokenUsage | null = null;

  // Iterate through all metrics and combine them
  for (const metrics of Object.values(stats.usage_to_metrics)) {
    // Add up costs
    totalCost += metrics.accumulated_cost;

    // Keep the max budget per task if any is set
    if (maxBudgetPerTask === null && metrics.max_budget_per_task !== null) {
      maxBudgetPerTask = metrics.max_budget_per_task;
    }

    // Combine token usage
    if (metrics.accumulated_token_usage) {
      if (combinedTokenUsage === null) {
        combinedTokenUsage = { ...metrics.accumulated_token_usage };
      } else {
        combinedTokenUsage = {
          prompt_tokens:
            combinedTokenUsage.prompt_tokens +
            metrics.accumulated_token_usage.prompt_tokens,
          completion_tokens:
            combinedTokenUsage.completion_tokens +
            metrics.accumulated_token_usage.completion_tokens,
          cache_read_tokens:
            combinedTokenUsage.cache_read_tokens +
            metrics.accumulated_token_usage.cache_read_tokens,
          cache_write_tokens:
            combinedTokenUsage.cache_write_tokens +
            metrics.accumulated_token_usage.cache_write_tokens,
          context_window: Math.max(
            combinedTokenUsage.context_window,
            metrics.accumulated_token_usage.context_window,
          ),
          per_turn_token: Math.max(
            combinedTokenUsage.per_turn_token,
            metrics.accumulated_token_usage.per_turn_token,
          ),
        };
      }
    }
  }

  return {
    accumulated_cost: totalCost,
    max_budget_per_task: maxBudgetPerTask,
    accumulated_token_usage: combinedTokenUsage,
  };
}

export function getCombinedMetrics(
  conversationInfo: RuntimeConversationInfo,
): MetricsSnapshot {
  return combineUsageMetrics(conversationInfo.stats);
}

export function toMetricsState(snapshot: MetricsSnapshot): MetricsState {
  const usage = snapshot.accumulated_token_usage;
  return {
    cost: snapshot.accumulated_cost,
    max_budget_per_task: snapshot.max_budget_per_task,
    usage: usage
      ? {
          prompt_tokens: usage.prompt_tokens ?? 0,
          completion_tokens: usage.completion_tokens ?? 0,
          cache_read_tokens: usage.cache_read_tokens ?? 0,
          cache_write_tokens: usage.cache_write_tokens ?? 0,
          context_window: usage.context_window ?? 0,
          per_turn_token: usage.per_turn_token ?? 0,
        }
      : null,
  };
}
