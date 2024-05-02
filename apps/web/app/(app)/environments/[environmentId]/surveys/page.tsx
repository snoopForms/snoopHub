import SurveyStarter from "@/app/(app)/environments/[environmentId]/surveys/components/SurveyStarter";
import { Metadata } from "next";
import { getServerSession } from "next-auth";

import { authOptions } from "@formbricks/lib/authOptions";
import { SURVEYS_PER_PAGE, WEBAPP_URL } from "@formbricks/lib/constants";
import { getEnvironment, getEnvironments } from "@formbricks/lib/environment/service";
import { getMembershipByUserIdTeamId } from "@formbricks/lib/membership/service";
import { getAccessFlags } from "@formbricks/lib/membership/utils";
import { getProductByEnvironmentId } from "@formbricks/lib/product/service";
import { getSurveyCount } from "@formbricks/lib/survey/service";
import { getTeamByEnvironmentId } from "@formbricks/lib/team/service";
import { SurveysList } from "@formbricks/ui/SurveysList";

export const metadata: Metadata = {
  title: "Your Surveys",
};

export default async function SurveysPage({ params }) {
  const session = await getServerSession(authOptions);
  const product = await getProductByEnvironmentId(params.environmentId);
  const team = await getTeamByEnvironmentId(params.environmentId);
  if (!session) {
    throw new Error("Session not found");
  }

  if (!product) {
    throw new Error("Product not found");
  }

  if (!team) {
    throw new Error("Team not found");
  }

  const currentUserMembership = await getMembershipByUserIdTeamId(session?.user.id, team.id);
  const { isViewer } = getAccessFlags(currentUserMembership?.role);

  const environment = await getEnvironment(params.environmentId);
  if (!environment) {
    throw new Error("Environment not found");
  }

  const surveyCount = await getSurveyCount(params.environmentId);

  const environments = await getEnvironments(product.id);
  const otherEnvironment = environments.find((e) => e.type !== environment.type)!;

  return (
    <>
      {surveyCount > 0 ? (
        <SurveysList
          environment={environment}
          otherEnvironment={otherEnvironment}
          isViewer={isViewer}
          WEBAPP_URL={WEBAPP_URL}
          userId={session.user.id}
          surveysPerPage={SURVEYS_PER_PAGE}
        />
      ) : (
        <SurveyStarter
          environmentId={params.environmentId}
          environment={environment}
          product={product}
          user={session.user}
        />
      )}
    </>
  );
}
