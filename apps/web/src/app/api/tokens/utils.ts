import { NextRequest } from "next/server";
import { Client } from "@langchain/langgraph-sdk";
import {
  GITHUB_TOKEN_COOKIE,
  GITHUB_INSTALLATION_ID_COOKIE,
  GITHUB_INSTALLATION_TOKEN_COOKIE,
  GITHUB_INSTALLATION_NAME,
  GITHUB_INSTALLATION_ID,
} from "@openswe/shared/constants";
import {
  getGitHubInstallationTokenOrThrow,
  getInstallationNameFromReq,
  getGitHubAccessTokenOrThrow,
} from "../[..._path]/utils";

export async function getRequestHeaders(
  req: NextRequest,
): Promise<Record<string, string>> {
  const encryptionKey = process.env.SECRETS_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error("SECRETS_ENCRYPTION_KEY environment variable is required");
  }
  const installationIdCookie = req.cookies.get(
    GITHUB_INSTALLATION_ID_COOKIE,
  )?.value;

  if (!installationIdCookie) {
    throw new Error(
      "No GitHub installation ID found. GitHub App must be installed first.",
    );
  }
  const [installationToken, installationName] = await Promise.all([
    getGitHubInstallationTokenOrThrow(installationIdCookie, encryptionKey),
    getInstallationNameFromReq(req, installationIdCookie),
  ]);

  return {
    [GITHUB_TOKEN_COOKIE]: getGitHubAccessTokenOrThrow(req, encryptionKey),
    [GITHUB_INSTALLATION_TOKEN_COOKIE]: installationToken,
    [GITHUB_INSTALLATION_NAME]: installationName,
    [GITHUB_INSTALLATION_ID]: installationIdCookie,
  };
}

export async function getLangGraphClient(req: NextRequest) {
  return new Client({
    apiUrl: process.env.LANGGRAPH_API_URL ?? "http://localhost:2024",
    defaultHeaders: await getRequestHeaders(req),
  });
}
