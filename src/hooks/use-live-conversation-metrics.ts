import useMetricsStore, {
  EMPTY_METRICS,
  type MetricsState,
} from "#/stores/metrics-store";
import { useActiveConversation } from "#/hooks/query/use-active-conversation";
import { useConversationMetrics } from "#/hooks/query/use-conversation-metrics";
import { toMetricsState } from "#/utils/conversation-metrics";

/**
 * Combined cost/token metrics for the active conversation.
 *
 * Selects the active conversation's complete metrics snapshot. REST hydrates
 * the keyed store before live WebSocket stats arrive and after reconnect.
 *
 * Pass `enabled: false` to pause the REST polling while the consumer is
 * hidden (e.g. a closed modal).
 */
export function useLiveConversationMetrics(
  enabled: boolean = true,
): MetricsState {
  const { data: conversation } = useActiveConversation();
  const storeMetrics = useMetricsStore(
    (state) => state.metricsByConversationId[conversation?.id ?? ""],
  );

  const { data: conversationMetrics } = useConversationMetrics(
    conversation?.id,
    conversation?.conversation_url,
    conversation?.session_api_key,
    enabled && Boolean(conversation?.id),
  );

  return (
    storeMetrics ??
    (conversationMetrics ? toMetricsState(conversationMetrics) : EMPTY_METRICS)
  );
}
