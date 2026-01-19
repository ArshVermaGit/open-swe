import { NextRequest, NextResponse } from "next/server";
import { getLangGraphClient } from "../utils";
import { GraphState, createInitialTokenBreakdown, TokenUsage, TokenCount } from "@openswe/shared/open-swe/types";
import { TokenHistoryResponse } from "../types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const client = await getLangGraphClient(request);
    
    // Fetch recent threads (tasks)
    const threads = await client.threads.search({
      limit: 100,
    }) as Array<{ thread_id: string, values: GraphState }>;

    const taskBreakdown: TokenHistoryResponse["taskBreakdown"] = [];
    let totalUsage = createInitialTokenBreakdown();

    for (const thread of threads) {
      if (thread.values && thread.values.tokenUsage) {
        const usage = thread.values.tokenUsage;
        const taskId = thread.thread_id;
        
        // Try to get a title for the task
        const title = (thread.values as any).taskPlan?.tasks?.[0]?.title ?? `Task ${taskId.substring(0, 8)}`;

        taskBreakdown.push({
          taskId,
          title,
          usage,
        });

        // Aggregate into totalUsage
        for (const agent of ["planner", "programmer", "reviewer", "manager"] as const) {
          const agentUsage = usage[agent] as TokenUsage;
          if (!agentUsage || !agentUsage.total) continue;

          totalUsage[agent].total.inputTokens += agentUsage.total.inputTokens || 0;
          totalUsage[agent].total.outputTokens += agentUsage.total.outputTokens || 0;
          totalUsage[agent].total.totalTokens += agentUsage.total.totalTokens || 0;
          totalUsage[agent].total.inputCost += agentUsage.total.inputCost || 0;
          totalUsage[agent].total.outputCost += agentUsage.total.outputCost || 0;
          totalUsage[agent].total.totalCost += agentUsage.total.totalCost || 0;

          // Merge byModel
          if (agentUsage.byModel) {
            for (const [model, modelData] of Object.entries(agentUsage.byModel)) {
              const modelUsage = modelData as TokenCount;
              if (!totalUsage[agent].byModel[model]) {
                totalUsage[agent].byModel[model] = { ...modelUsage };
              } else {
                totalUsage[agent].byModel[model].inputTokens += modelUsage.inputTokens || 0;
                totalUsage[agent].byModel[model].outputTokens += modelUsage.outputTokens || 0;
                totalUsage[agent].byModel[model].totalTokens += modelUsage.totalTokens || 0;
                totalUsage[agent].byModel[model].inputCost += modelUsage.inputCost || 0;
                totalUsage[agent].byModel[model].outputCost += modelUsage.outputCost || 0;
                totalUsage[agent].byModel[model].totalCost += modelUsage.totalCost || 0;
              }
            }
          }
        }
      }
    }

    const response: TokenHistoryResponse = {
      totalUsage,
      taskBreakdown,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Failed to fetch token history:", error);
    return NextResponse.json(
      { error: "Failed to fetch token history", details: error.message },
      { status: 500 }
    );
  }
}
