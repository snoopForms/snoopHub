"use client";

import { Greeting } from "@/app/(ee)/environments/[environmentId]/experience/components/Greeting";
import { InsightsTable } from "@/app/(ee)/environments/[environmentId]/experience/components/InsightsTable";
import { ExperiencePageStats } from "@/app/(ee)/environments/[environmentId]/experience/components/Stats";
import { SurveyTemplates } from "@/app/(ee)/environments/[environmentId]/experience/components/SurveyTemplates";
import { getDateFromTimeRange } from "@/app/(ee)/environments/[environmentId]/experience/lib/utils";
import { TStatsPeriod } from "@/app/(ee)/environments/[environmentId]/experience/types/stats";
import { useState } from "react";
import { TEnvironment } from "@formbricks/types/environment";
import { TProduct } from "@formbricks/types/product";
import { TUser } from "@formbricks/types/user";
import { ToggleGroup, ToggleGroupItem } from "@formbricks/ui/components/ToggleGroup";

interface ExperiencePageProps {
  user: TUser;
  environment: TEnvironment;
  product: TProduct;
  insightsPerPage: number;
  documentsPerPage: number;
}

export const ExperiencePage = ({
  environment,
  product,
  user,
  insightsPerPage,
  documentsPerPage,
}: ExperiencePageProps) => {
  const [statsPeriod, setStatsPeriod] = useState<TStatsPeriod>("week");
  const statsFrom = getDateFromTimeRange(statsPeriod);
  return (
    <div className="container mx-auto space-y-6 p-4">
      <Greeting userName={user.name} />
      <ToggleGroup
        type="single"
        value={statsPeriod}
        onValueChange={(value) => value && setStatsPeriod(value as TStatsPeriod)}>
        <ToggleGroupItem value="all" aria-label="Toggle all">
          All
        </ToggleGroupItem>
        <ToggleGroupItem value="day" aria-label="Toggle day">
          Day
        </ToggleGroupItem>
        <ToggleGroupItem value="week" aria-label="Toggle week">
          Week
        </ToggleGroupItem>
        <ToggleGroupItem value="month" aria-label="Toggle month">
          Month
        </ToggleGroupItem>
        <ToggleGroupItem value="quarter" aria-label="Toggle quarter">
          Quarter
        </ToggleGroupItem>
      </ToggleGroup>
      <ExperiencePageStats statsFrom={statsFrom} environmentId={environment.id} />
      <InsightsTable
        statsFrom={statsFrom}
        productName={product.name}
        environmentId={environment.id}
        insightsPerPage={insightsPerPage}
        documentsPerPage={documentsPerPage}
      />
      <SurveyTemplates
        environment={environment}
        product={product}
        user={user}
        prefilledFilters={["link", null, "customerSuccess"]}
      />
    </div>
  );
};
