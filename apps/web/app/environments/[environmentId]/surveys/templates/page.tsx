import TemplateContainerWithPreview from "./TempContainer2";
import { getEnvironment } from "@formbricks/lib/services/environment";
import { getProductByEnvironmentId } from "@formbricks/lib/services/product";

export default async function SurveyTemplatesPage({ params }) {
  const environmentId = params.environmentId;
  const environment = await getEnvironment(environmentId);
  const product = await getProductByEnvironmentId(environmentId);

  return (
    <TemplateContainerWithPreview environmentId={environmentId} environment={environment} product={product} />
  );
}
