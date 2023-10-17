export const revalidate = REVALIDATION_INTERVAL;
import { getActionClasses } from "@formbricks/lib/actionClass/service";
import { getAttributeClasses } from "@formbricks/lib/attributeClass/service";
import { REVALIDATION_INTERVAL } from "@formbricks/lib/constants";
import { getEnvironment } from "@formbricks/lib/environment/service";
import { getProductByEnvironmentId } from "@formbricks/lib/product/service";
import { getSurveyWithAnalytics } from "@formbricks/lib/survey/service";
import { ErrorComponent } from "@formbricks/ui/ErrorComponent";
import SurveyEditor from "./components/SurveyEditor";

export default async function SurveysEditPage({ params }) {
  const [survey, product, environment, actionClasses, attributeClasses] = await Promise.all([
    getSurveyWithAnalytics(params.surveyId),
    getProductByEnvironmentId(params.environmentId),
    getEnvironment(params.environmentId),
    getActionClasses(params.environmentId),
    getAttributeClasses(params.environmentId),
  ]);

  if (!survey || !environment || !actionClasses || !attributeClasses || !product) {
    return <ErrorComponent />;
  }

  return (
    <>
      <SurveyEditor
        survey={survey}
        product={product}
        environment={environment}
        actionClasses={actionClasses}
        attributeClasses={attributeClasses}
      />
    </>
  );
}
