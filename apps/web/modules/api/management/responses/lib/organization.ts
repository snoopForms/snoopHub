import { getAllEnvironmentsFromOrganizationId } from "@/modules/api/management/responses/lib/project";
import { ApiErrorResponse } from "@/modules/api/types/api-error";
import { Organization, Prisma } from "@prisma/client";
import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { cache } from "@formbricks/lib/cache";
import { organizationCache } from "@formbricks/lib/organization/cache";
import { Result, err, ok } from "@formbricks/types/error-handlers";

export const getOrganizationIdFromEnvironmentId = reactCache(async (environmentId: string) =>
  cache(
    async (): Promise<Result<string, ApiErrorResponse>> => {
      const organization = await prisma.organization.findFirst({
        where: {
          projects: {
            some: {
              environments: {
                some: {
                  id: environmentId,
                },
              },
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!organization) {
        return err({ type: "not_found", details: [{ field: "organization", issue: "not found" }] });
      }

      return ok(organization.id);
    },
    [`management-getOrganizationIdFromEnvironmentId-${environmentId}`],
    {
      tags: [organizationCache.tag.byEnvironmentId(environmentId)],
    }
  )()
);

export const getOrganizationBilling = reactCache(async (organizationId: string) =>
  cache(
    async (): Promise<Result<Pick<Organization, "billing">, ApiErrorResponse>> => {
      try {
        const organization = await prisma.organization.findFirst({
          where: {
            id: organizationId,
          },
          select: {
            billing: true,
          },
        });

        if (!organization) {
          return err({ type: "not_found", details: [{ field: "organization", issue: "not found" }] });
        }

        return ok(organization);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          return err({
            type: "internal_server_error",
            details: [{ field: "organization", issue: error.message }],
          });
        }

        throw error;
      }
    },
    [`management-getOrganizationBilling-${organizationId}`],
    {
      tags: [organizationCache.tag.byId(organizationId)],
    }
  )()
);

export const getMonthlyOrganizationResponseCount = reactCache(async (organizationId: string) =>
  cache(
    async (): Promise<Result<number, ApiErrorResponse>> => {
      try {
        const organization = await getOrganizationBilling(organizationId);
        if (!organization.ok) {
          return err(organization.error);
        }

        // Determine the start date based on the plan type
        let startDate: Date;
        if (organization.data.billing.plan === "free") {
          // For free plans, use the first day of the current calendar month
          const now = new Date();
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
          // For other plans, use the periodStart from billing
          if (!organization.data.billing.periodStart) {
            return err({
              type: "internal_server_error",
              details: [{ field: "organization", issue: "billing period start is not set" }],
            });
          }
          startDate = organization.data.billing.periodStart;
        }

        // Get all environment IDs for the organization
        const environmentIdsResult = await getAllEnvironmentsFromOrganizationId(organizationId);
        if (!environmentIdsResult.ok) {
          return err(environmentIdsResult.error);
        }

        // Use Prisma's aggregate to count responses for all environments
        const responseAggregations = await prisma.response.aggregate({
          _count: {
            id: true,
          },
          where: {
            AND: [
              { survey: { environmentId: { in: environmentIdsResult.data } } },
              { createdAt: { gte: startDate } },
            ],
          },
        });

        // The result is an aggregation of the total count
        return ok(responseAggregations._count.id);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          return err({
            type: "internal_server_error",
            details: [{ field: "organization", issue: error.message }],
          });
        }

        throw error;
      }
    },
    [`management-getMonthlyOrganizationResponseCount-${organizationId}`],
    {
      revalidate: 60 * 60 * 2, // 2 hours
    }
  )()
);
