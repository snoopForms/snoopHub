import { InboxIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { JSX } from "react";
import { getQuestionTypes } from "@formbricks/lib/utils/questions";
import { recallToHeadline } from "@formbricks/lib/utils/recall";
import { TContactAttributeKey } from "@formbricks/types/contact-attribute-key";
import { TSurvey, TSurveyQuestionSummary } from "@formbricks/types/surveys/types";
import { TUserLocale } from "@formbricks/types/user";

interface HeadProps {
  questionSummary: TSurveyQuestionSummary;
  showResponses?: boolean;
  additionalInfo?: JSX.Element;
  survey: TSurvey;
  contactAttributeKeys: TContactAttributeKey[];
  locale: TUserLocale;
}

export const QuestionSummaryHeader = ({
  questionSummary,
  additionalInfo,
  showResponses = true,
  survey,
  contactAttributeKeys,
  locale,
}: HeadProps) => {
  const questionType = getQuestionTypes(locale).find((type) => type.id === questionSummary.question.type);
  const t = useTranslations();
  // formats the text to highlight specific parts of the text with slashes
  const formatTextWithSlashes = (text: string): (string | JSX.Element)[] => {
    const regex = /\/(.*?)\\/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      // Check if the part was inside slashes
      if (index % 2 !== 0) {
        return (
          <span key={index} className="mx-1 rounded-md bg-slate-100 p-1 px-2 text-lg">
            @{part}
          </span>
        );
      } else {
        return part;
      }
    });
  };

  return (
    <div className="space-y-2 px-4 pb-5 pt-6 md:px-6">
      <div className={"align-center flex justify-between gap-4"}>
        <h3 className="pb-1 text-lg font-semibold text-slate-900 md:text-xl">
          {formatTextWithSlashes(
            recallToHeadline(
              questionSummary.question.headline,
              survey,
              true,
              "default",
              contactAttributeKeys
            )["default"]
          )}
        </h3>
      </div>
      <div className="flex space-x-2 text-xs font-semibold text-slate-600 md:text-sm">
        <div className="flex items-center rounded-lg bg-slate-100 p-2">
          {questionType && <questionType.icon className="mr-2 h-4 w-4" />}
          {questionType ? questionType.label : t("environments.surveys.summary.unknown_question_type")}{" "}
          {t("common.question")}
        </div>
        {showResponses && (
          <div className="flex items-center rounded-lg bg-slate-100 p-2">
            <InboxIcon className="mr-2 h-4 w-4" />
            {`${questionSummary.responseCount} ${t("common.responses")}`}
          </div>
        )}
        {additionalInfo}
        {!questionSummary.question.required && (
          <div className="flex items-center rounded-lg bg-slate-100 p-2">
            {t("environments.surveys.edit.optional")}
          </div>
        )}
      </div>
    </div>
  );
};
