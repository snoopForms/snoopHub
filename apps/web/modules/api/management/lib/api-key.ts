import { apiKeyCache } from "@/lib/cache/api-key";
import { ApiErrorResponse } from "@/modules/api/types/api-error";
import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { cache } from "@formbricks/lib/cache";
import { getHash } from "@formbricks/lib/crypto";
import { validateInputs } from "@formbricks/lib/utils/validate";
import { ZString } from "@formbricks/types/common";
import { Result, err, ok } from "@formbricks/types/error-handlers";
import { InvalidInputError } from "@formbricks/types/errors";

export const getEnvironmentIdFromApiKey = reactCache(async (apiKey: string) => {
  const hashedKey = getHash(apiKey);
  return cache(
    async (): Promise<Result<string, ApiErrorResponse>> => {
      validateInputs([apiKey, ZString]);

      if (!apiKey) {
        throw new InvalidInputError("API key cannot be null or undefined.");
      }

      try {
        const apiKeyData = await prisma.apiKey.findUnique({
          where: {
            hashedKey,
          },
          select: {
            environmentId: true,
          },
        });

        if (!apiKeyData) {
          return err({ type: "not_found", details: [{ field: "apiKey", issue: "not found" }] });
        }

        return ok(apiKeyData.environmentId);
      } catch (error) {
        return err({ type: "internal_server_error", details: [{ field: "apiKey", issue: error.message }] });
      }
    },
    [`management-api-getEnvironmentIdFromApiKey-${apiKey}`],
    {
      tags: [apiKeyCache.tag.byHashedKey(hashedKey)],
    }
  )();
});
