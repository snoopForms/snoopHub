import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@formbricks/lib/authOptions";
import { getFirstEnvironmentByUserId } from "@formbricks/lib/environment/service";
import { getProductByEnvironmentId } from "@formbricks/lib/product/service";
import { getUser } from "@formbricks/lib/user/service";
import { Onboarding } from "@formbricks/ui/Onboarding";
import OnboardingLinkSurvey from "@formbricks/ui/Onboarding/components/OnboardingLinkSurvey";

export default async function InAppSurveyOnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/login");
  }
  const userId = session?.user.id;
  const environment = await getFirstEnvironmentByUserId(userId);

  if (!environment) {
    throw new Error("No environment found for user");
  }

  const user = await getUser(userId);
  const product = await getProductByEnvironmentId(environment?.id!);

  if (!environment || !user || !product) {
    throw new Error("Failed to get environment, user, or product");
  }

  return <OnboardingLinkSurvey environmentId={environment.id} />;
}
