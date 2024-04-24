import { useMemo } from "react";

import { cn } from "@formbricks/lib/cn";
import { capitalizeFirstLetter } from "@formbricks/lib/strings";
import { TCardArrangementOptions } from "@formbricks/types/styling";
import { TSurveyType } from "@formbricks/types/surveys";

import { Button } from "../../Button";

interface CardArrangementProps {
  surveyType: TSurveyType;
  activeCardArrangement: TCardArrangementOptions;
  setActiveCardArrangement: (arrangement: TCardArrangementOptions, surveyType: TSurveyType) => void;
  disabled?: boolean;
}

export const CardArrangement = ({
  activeCardArrangement,
  surveyType,
  setActiveCardArrangement,
  disabled = false,
}: CardArrangementProps) => {
  const surveyTypeDerived = useMemo(() => {
    return surveyType == "link" ? "Link" : "In App";
  }, [surveyType]);
  const cardArrangementTypes: TCardArrangementOptions[] = ["casual", "straight", "simple"];

  const handleCardArrangementChange = (arrangement: TCardArrangementOptions) => {
    if (disabled) return;
    setActiveCardArrangement(arrangement, surveyType);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <h3 className="text-base font-semibold text-slate-900">
          Card Arrangement for {surveyTypeDerived} Surveys
        </h3>
        <p className="text-sm text-slate-800">
          How funky do you want your cards in {surveyTypeDerived} Surveys
        </p>
      </div>

      <div className="flex gap-2 rounded-md border border-slate-300 bg-white p-1">
        {cardArrangementTypes.map((cardArrangement) => {
          return (
            <Button
              variant="minimal"
              size="sm"
              className={cn(
                "flex flex-1 justify-center bg-white text-center",
                activeCardArrangement === cardArrangement && "bg-slate-200"
              )}
              disabled={disabled}
              onClick={() => handleCardArrangementChange(cardArrangement)}>
              {capitalizeFirstLetter(cardArrangement)}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
