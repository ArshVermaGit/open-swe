import { NextRequest, NextResponse } from "next/server";
import { getLangGraphClient } from "../../../tokens/utils";
import { GraphState } from "@openswe/shared/open-swe/types";
import { TaskTokenUsageResponse } from "../../../tokens/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
): Promise<NextResponse> {
  const { taskId } = params;

  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  try {
    const client = await getLangGraphClient(request);
    const threadState = await client.threads.getState<GraphState>(taskId);

    if (!threadState || !threadState.values) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const { tokenUsage } = threadState.values;
    
    // Calculate total cost from all agents
    const totalCost = Object.values(tokenUsage || {}).reduce(
      (acc, agentUsage) => acc + (agentUsage.total?.totalCost || 0),
      0
    );

    const response: TaskTokenUsageResponse = {
      taskId,
      usage: tokenUsage,
      totalCost,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`Failed to fetch tokens for task ${taskId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch token usage", details: error.message },
      { status: 500 }
    );
  }
}
