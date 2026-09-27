import { create } from "zustand";

export interface MetricsState {
  cost: number | null;
  max_budget_per_task: number | null;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    cache_read_tokens: number;
    cache_write_tokens: number;
    context_window: number;
    per_turn_token: number;
  } | null;
}

export interface MetricsStore {
  metricsByConversationId: Record<string, MetricsState>;
  wsGenerationByConversationId: Record<string, number>;
  setWebSocketSnapshot: (conversationId: string, metrics: MetricsState) => void;
  hydrateRestSnapshot: (
    conversationId: string,
    metrics: MetricsState,
    expectedWsGeneration: number,
  ) => void;
}

export const EMPTY_METRICS: MetricsState = {
  cost: null,
  max_budget_per_task: null,
  usage: null,
};

const useMetricsStore = create<MetricsStore>((set) => ({
  metricsByConversationId: {},
  wsGenerationByConversationId: {},
  setWebSocketSnapshot: (conversationId, metrics) =>
    set((state) => ({
      metricsByConversationId: {
        ...state.metricsByConversationId,
        [conversationId]: metrics,
      },
      wsGenerationByConversationId: {
        ...state.wsGenerationByConversationId,
        [conversationId]:
          (state.wsGenerationByConversationId[conversationId] ?? 0) + 1,
      },
    })),
  hydrateRestSnapshot: (conversationId, metrics, expectedWsGeneration) =>
    set((state) => {
      if (
        (state.wsGenerationByConversationId[conversationId] ?? 0) !==
        expectedWsGeneration
      ) {
        return state;
      }
      return {
        metricsByConversationId: {
          ...state.metricsByConversationId,
          [conversationId]: metrics,
        },
      };
    }),
}));

// Dev-only console handle for inspecting the live WS metrics while
// debugging the usage meter (window.__OH_METRICS_STORE__.getState()).
// Gated on import.meta.env.DEV so it never reaches production builds.
if (typeof window !== "undefined" && import.meta.env.DEV) {
  (
    window as unknown as { __OH_METRICS_STORE__?: typeof useMetricsStore }
  ).__OH_METRICS_STORE__ = useMetricsStore;
}

export default useMetricsStore;
