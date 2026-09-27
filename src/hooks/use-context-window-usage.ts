import { useLiveConversationMetrics } from "#/hooks/use-live-conversation-metrics";

export interface ContextWindowUsage {
  perTurnToken: number;
  contextWindow: number;
}

function toContextWindowUsage(
  usage:
    | {
        per_turn_token?: number | null;
        context_window?: number | null;
      }
    | null
    | undefined,
): ContextWindowUsage | null {
  const contextWindow = usage?.context_window ?? 0;
  if (contextWindow <= 0) {
    return null;
  }

  return {
    perTurnToken: usage?.per_turn_token ?? 0,
    contextWindow,
  };
}

export function useContextWindowUsage(): ContextWindowUsage | null {
  const { usage } = useLiveConversationMetrics();
  return toContextWindowUsage(usage);
}
