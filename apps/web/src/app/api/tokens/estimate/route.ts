import { NextRequest, NextResponse } from "next/server";
import { estimateCostFromText, calculateCost, isValidModel } from "@openswe/shared";
import { CostEstimateRequest, CostEstimateResponse } from "../types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const promptLength = parseInt(searchParams.get("promptLength") || "0");
    const modelName = searchParams.get("modelName") || "";
    const expectedOutputLength = parseInt(searchParams.get("expectedOutputLength") || "0");

    if (!modelName) {
      return NextResponse.json({ error: "modelName is required" }, { status: 400 });
    }

    if (!isValidModel(modelName)) {
      return NextResponse.json({ error: `Invalid model name: ${modelName}` }, { status: 400 });
    }

    let estimate;
    if (expectedOutputLength > 0) {
      const inputTokens = Math.ceil(promptLength / 4);
      const outputTokens = Math.ceil(expectedOutputLength / 4);
      estimate = calculateCost(inputTokens, outputTokens, modelName);
    } else {
      // Use default 1.5x output ratio estimate
      // Since estimateCostFromText expects a string, we'll simulate one with blanks
      const placeholderText = " ".repeat(promptLength);
      estimate = estimateCostFromText(placeholderText, 1.5, modelName);
    }

    const response: CostEstimateResponse = {
      estimatedCost: estimate.totalCost,
      inputCost: estimate.inputCost,
      outputCost: estimate.outputCost,
      currency: "USD",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Failed to calculate cost estimate:", error);
    return NextResponse.json(
      { error: "Failed to calculate cost estimate", details: error.message },
      { status: 500 }
    );
  }
}
