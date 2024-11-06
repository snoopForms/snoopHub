"use server";

import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client-middleware";
import { transferOwnership, updateMembership } from "@/modules/ee/role-management/lib/membership";
import { z } from "zod";
import { isOwner } from "@formbricks/lib/auth";
import { updateInvite } from "@formbricks/lib/invite/service";
import { getMembershipByUserIdOrganizationId } from "@formbricks/lib/membership/service";
import { ZId, ZUuid } from "@formbricks/types/common";
import { AuthorizationError, ValidationError } from "@formbricks/types/errors";
import { ZInviteUpdateInput } from "@formbricks/types/invites";
import { ZMembershipUpdateInput } from "@formbricks/types/memberships";

const ZTransferOwnershipAction = z.object({
  organizationId: ZId,
  newOwnerId: ZId,
});

export const transferOwnershipAction = authenticatedActionClient
  .schema(ZTransferOwnershipAction)
  .action(async ({ ctx, parsedInput }) => {
    const isUserOwner = await isOwner(ctx.user.id, parsedInput.organizationId);
    if (!isUserOwner) {
      throw new AuthorizationError("Not authorized");
    }

    if (parsedInput.newOwnerId === ctx.user.id) {
      throw new ValidationError("You are already the owner of this organization");
    }

    const membership = await getMembershipByUserIdOrganizationId(
      parsedInput.newOwnerId,
      parsedInput.organizationId
    );
    if (!membership) {
      throw new ValidationError("User is not a member of this organization");
    }

    await transferOwnership(ctx.user.id, parsedInput.newOwnerId, parsedInput.organizationId);
  });

const ZUpdateInviteAction = z.object({
  inviteId: ZUuid,
  organizationId: ZId,
  data: ZInviteUpdateInput,
});

export const updateInviteAction = authenticatedActionClient
  .schema(ZUpdateInviteAction)
  .action(async ({ ctx, parsedInput }) => {
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: parsedInput.organizationId,
      access: [
        {
          data: parsedInput.data,
          schema: ZInviteUpdateInput,
          type: "organization",
          roles: ["owner", "manager"],
        },
      ],
    });

    return await updateInvite(parsedInput.inviteId, parsedInput.data);
  });

const ZUpdateMembershipAction = z.object({
  userId: ZId,
  organizationId: ZId,
  data: ZMembershipUpdateInput,
});

export const updateMembershipAction = authenticatedActionClient
  .schema(ZUpdateMembershipAction)
  .action(async ({ ctx, parsedInput }) => {
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: parsedInput.organizationId,
      access: [
        {
          data: parsedInput.data,
          schema: ZMembershipUpdateInput,
          type: "organization",
          roles: ["owner", "manager"],
        },
      ],
    });

    return await updateMembership(parsedInput.userId, parsedInput.organizationId, parsedInput.data);
  });
