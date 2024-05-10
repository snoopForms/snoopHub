"use client";

import type { TEnvironment } from "@formbricks/types/environment";
import type { TProduct } from "@formbricks/types/product";
import { TUser } from "@formbricks/types/user";
import { TemplateList } from "@formbricks/ui/TemplateList";

export default function SurveyStarter({
  environmentId,
  environment,
  product,
  user,
}: {
  environmentId: string;
  environment: TEnvironment;
  product: TProduct;
  user: TUser;
}) {
  return (
    <>
      <h1 className="px-6 text-3xl font-extrabold text-slate-700">
        You&apos;re all set! Time to create your first survey.
      </h1>

      <TemplateList
        environmentId={environmentId}
        /* onTemplateClick={(template) => {
              newSurveyFromTemplate(template);
            }} */
        environment={environment}
        product={product}
        user={user}
      />
    </>
  );
}
