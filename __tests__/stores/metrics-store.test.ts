import { beforeEach, describe, expect, it } from "vitest";
import useMetricsStore, { type MetricsState } from "#/stores/metrics-store";

const snapshot = (cacheReadTokens: number): MetricsState => ({
  cost: cacheReadTokens / 10,
  max_budget_per_task: 5,
  usage: {
    prompt_tokens: 10,
    completion_tokens: 2,
    cache_read_tokens: cacheReadTokens,
    cache_write_tokens: 1,
    context_window: 128_000,
    per_turn_token: 12,
  },
});

describe("metrics store", () => {
  beforeEach(() => {
    useMetricsStore.setState({
      metricsByConversationId: {},
      wsGenerationByConversationId: {},
    });
  });

  it("keeps main and planning snapshots isolated by conversation id", () => {
    const { setWebSocketSnapshot } = useMetricsStore.getState();

    setWebSocketSnapshot("main", snapshot(8));
    setWebSocketSnapshot("planning", {
      cost: 1,
      max_budget_per_task: null,
      usage: null,
    });

    expect(useMetricsStore.getState().metricsByConversationId).toEqual({
      main: snapshot(8),
      planning: {
        cost: 1,
        max_budget_per_task: null,
        usage: null,
      },
    });
  });

  it("atomically replaces a WebSocket snapshot, including null usage", () => {
    const { setWebSocketSnapshot } = useMetricsStore.getState();
    setWebSocketSnapshot("main", snapshot(8));

    setWebSocketSnapshot("main", {
      cost: 2,
      max_budget_per_task: 9,
      usage: null,
    });

    expect(useMetricsStore.getState().metricsByConversationId.main).toEqual({
      cost: 2,
      max_budget_per_task: 9,
      usage: null,
    });
    expect(useMetricsStore.getState().wsGenerationByConversationId.main).toBe(
      2,
    );
  });

  it("rejects a REST snapshot when WebSocket generation advanced", () => {
    const { hydrateRestSnapshot, setWebSocketSnapshot } =
      useMetricsStore.getState();
    const expectedGeneration = 0;

    setWebSocketSnapshot("main", snapshot(9));
    hydrateRestSnapshot("main", snapshot(1), expectedGeneration);

    expect(useMetricsStore.getState().metricsByConversationId.main).toEqual(
      snapshot(9),
    );
  });
});
