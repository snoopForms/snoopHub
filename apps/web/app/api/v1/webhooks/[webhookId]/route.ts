import { getEnvironmentIdFromApiKey } from "@/app/api/v1/lib/api-key";
import { responses } from "@/app/lib/api/response";
import { headers } from "next/headers";
import { deleteWebhook, getWebhook } from "@formbricks/lib/webhook/service";

export const GET = async (_: Request, props: { params: Promise<{ webhookId: string }> }) => {
  const params = await props.params;
  const headersList = await headers();
  const apiKey = headersList.get("x-api-key");
  if (!apiKey) {
    return responses.notAuthenticatedResponse();
  }
  const apiKeyData = await getEnvironmentIdFromApiKey(apiKey);
  if (!apiKeyData) {
    return responses.notAuthenticatedResponse();
  }

  // add webhook to database
  const webhook = await getWebhook(params.webhookId);
  if (!webhook) {
    return responses.notFoundResponse("Webhook", params.webhookId);
  }
  if (webhook.environmentId !== apiKeyData.environmentId) {
    return responses.unauthorizedResponse();
  }
  return responses.successResponse(webhook);
};

export const DELETE = async (_: Request, props: { params: Promise<{ webhookId: string }> }) => {
  const params = await props.params;
  const headersList = await headers();
  const apiKey = headersList.get("x-api-key");
  if (!apiKey) {
    return responses.notAuthenticatedResponse();
  }
  const apiKeyData = await getEnvironmentIdFromApiKey(apiKey);
  if (!apiKeyData) {
    return responses.notAuthenticatedResponse();
  }

  // check if webhook exists
  const webhook = await getWebhook(params.webhookId);
  if (!webhook) {
    return responses.notFoundResponse("Webhook", params.webhookId);
  }
  if (webhook.environmentId !== apiKeyData.environmentId) {
    return responses.unauthorizedResponse();
  }

  // delete webhook from database
  try {
    const webhook = await deleteWebhook(params.webhookId);
    return responses.successResponse(webhook);
  } catch (e) {
    console.error(e.message);
    return responses.notFoundResponse("Webhook", params.webhookId);
  }
};
