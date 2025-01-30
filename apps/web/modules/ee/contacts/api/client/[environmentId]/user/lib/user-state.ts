import { contactCache } from "@/lib/cache/contact";
import { contactAttributeCache } from "@/lib/cache/contact-attribute";
import { prisma } from "@formbricks/database";
import { cache } from "@formbricks/lib/cache";
import { segmentCache } from "@formbricks/lib/cache/segment";
import { IS_FORMBRICKS_CLOUD } from "@formbricks/lib/constants";
import { displayCache } from "@formbricks/lib/display/cache";
import { environmentCache } from "@formbricks/lib/environment/cache";
import { getEnvironment } from "@formbricks/lib/environment/service";
import { organizationCache } from "@formbricks/lib/organization/cache";
import { getOrganizationByEnvironmentId } from "@formbricks/lib/organization/service";
import { responseCache } from "@formbricks/lib/response/cache";
import { ResourceNotFoundError } from "@formbricks/types/errors";
import { TJsPersonState } from "@formbricks/types/js";
import { getPersonSegmentIds } from "./segments";

/**
 *
 * @param environmentId - The environment id
 * @param userId - The user id
 * @param device - The device type
 * @param attributes - The contact attributes
 * @returns The person state
 * @throws {ValidationError} - If the input is invalid
 * @throws {ResourceNotFoundError} - If the environment or organization is not found
 */
export const getUserState = async ({
  environmentId,
  userId,
  contactId,
  device,
  attributes,
}: {
  environmentId: string;
  userId: string;
  contactId: string;
  device: "phone" | "desktop";
  attributes: Record<string, string>;
}): Promise<TJsPersonState> =>
  cache(
    async () => {
      const environment = await getEnvironment(environmentId);

      if (!environment) {
        throw new ResourceNotFoundError(`environment`, environmentId);
      }

      const organization = await getOrganizationByEnvironmentId(environmentId);

      if (!organization) {
        throw new ResourceNotFoundError(`organization`, environmentId);
      }

      const contactResponses = await prisma.response.findMany({
        where: {
          contactId,
        },
        select: {
          surveyId: true,
        },
      });

      const contactDisplays = await prisma.display.findMany({
        where: {
          contactId,
        },
        select: {
          surveyId: true,
          createdAt: true,
        },
      });

      const segments = await getPersonSegmentIds(environmentId, contactId, userId, attributes, device);

      // If the person exists, return the persons's state
      const userState: TJsPersonState = {
        expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 minutes
        data: {
          userId,
          segments,
          displays:
            contactDisplays?.map((display) => ({
              surveyId: display.surveyId,
              createdAt: display.createdAt,
            })) ?? [],
          responses: contactResponses?.map((response) => response.surveyId) ?? [],
          lastDisplayAt:
            contactDisplays.length > 0
              ? contactDisplays.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
              : null,
        },
      };

      return userState;
    },
    [`personState-${environmentId}-${userId}-${device}`],
    {
      ...(IS_FORMBRICKS_CLOUD && { revalidate: 24 * 60 * 60 }),
      tags: [
        environmentCache.tag.byId(environmentId),
        organizationCache.tag.byEnvironmentId(environmentId),
        contactCache.tag.byEnvironmentIdAndUserId(environmentId, userId),
        contactAttributeCache.tag.byEnvironmentIdAndUserId(environmentId, userId),
        displayCache.tag.byEnvironmentIdAndUserId(environmentId, userId),
        responseCache.tag.byEnvironmentIdAndUserId(environmentId, userId),
        segmentCache.tag.byEnvironmentId(environmentId),
      ],
    }
  )();
