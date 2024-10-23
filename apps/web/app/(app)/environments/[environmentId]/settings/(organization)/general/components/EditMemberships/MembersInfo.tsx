import { MemberActions } from "@/app/(app)/environments/[environmentId]/settings/(organization)/general/components/EditMemberships/MemberActions";
import { isInviteExpired } from "@/app/lib/utils";
import { EditMembershipRole } from "@formbricks/ee/role-management/components/edit-membership-role";
import { TInvite } from "@formbricks/types/invites";
import { TMember, TOrganizationRole } from "@formbricks/types/memberships";
import { TOrganization } from "@formbricks/types/organizations";
import { Badge } from "@formbricks/ui/components/Badge";

type MembersInfoProps = {
  organization: TOrganization;
  members: TMember[];
  invites: TInvite[];
  isUserManagerOrOwner: boolean;
  currentUserId: string;
  currentUserRole: TOrganizationRole;
  canDoRoleManagement: boolean;
};

// Type guard to check if member is an invitee
const isInvitee = (member: TMember | TInvite): member is TInvite => {
  return (member as TInvite).expiresAt !== undefined;
};

export const MembersInfo = async ({
  organization,
  invites,
  isUserManagerOrOwner,
  members,
  currentUserId,
  currentUserRole,
  canDoRoleManagement,
}: MembersInfoProps) => {
  const allMembers = [...members, ...invites];

  return (
    <div className="grid-cols-20" id="membersInfoWrapper">
      {allMembers.map((member) => (
        <div
          className="singleMemberInfo grid-cols-20 grid h-auto w-full content-center rounded-lg px-4 py-3 text-left text-sm text-slate-900"
          key={member.email}>
          <div className="ph-no-capture col-span-5 flex flex-col justify-center break-all">
            <p>{member.name}</p>
          </div>
          <div className="ph-no-capture col-span-5 flex flex-col justify-center break-all">
            {member.email}
          </div>

          <div className="ph-no-capture col-span-5 flex flex-col items-start justify-center break-all">
            {canDoRoleManagement && allMembers?.length > 0 && (
              <EditMembershipRole
                isUserManagerOrOwner={isUserManagerOrOwner}
                memberRole={member.organizationRole}
                memberId={!isInvitee(member) ? member.userId : ""}
                memberName={member.name ?? ""}
                organizationId={organization.id}
                userId={currentUserId}
                memberAccepted={!isInvitee(member) ? member.accepted : undefined}
                inviteId={isInvitee(member) ? member.id : ""}
                currentUserRole={currentUserRole}
              />
            )}
          </div>

          <div className="col-span-5 flex items-center justify-end gap-x-4 pr-4">
            {isInvitee(member) &&
              (isInviteExpired(member) ? (
                <Badge className="mr-2" type="gray" text="Expired" size="tiny" />
              ) : (
                <Badge className="mr-2" type="warning" text="Pending" size="tiny" />
              ))}

            <MemberActions
              organization={organization}
              member={!isInvitee(member) ? member : undefined}
              invite={isInvitee(member) ? member : undefined}
              showDeleteButton={
                isUserManagerOrOwner &&
                member.organizationRole !== "owner" &&
                (member as TMember).userId !== currentUserId
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
};
