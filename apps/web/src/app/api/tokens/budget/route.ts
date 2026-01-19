import { NextRequest, NextResponse } from "next/server";
import { getLangGraphClient } from "../utils";
import { GraphState } from "@openswe/shared/open-swe/types";
import { UpdateBudgetRequest, UpdateBudgetResponse } from "../types";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: UpdateBudgetRequest = await request.json();
    const { taskId, budgetSettings } = body;

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    if (!budgetSettings) {
      return NextResponse.json({ error: "budgetSettings is required" }, { status: 400 });
    }

    const client = await getLangGraphClient(request);
    
    // Update the thread state with new budget settings
    // LangGraph's updateState will trigger the reducer to merge/update
    await client.threads.updateState(taskId, {
      values: {
        budgetSettings,
      },
    });

    // Fetch the updated state to confirm and return it
    const threadState = await client.threads.getState<GraphState>(taskId);
    
    const response: UpdateBudgetResponse = {
      success: true,
      budgetSettings: threadState.values.budgetSettings,
      warnings: threadState.values.budgetWarnings || [],
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Failed to update budget settings:", error);
    return NextResponse.json(
      { error: "Failed to update budget settings", details: error.message },
      { status: 500 }
    );
  }
}
