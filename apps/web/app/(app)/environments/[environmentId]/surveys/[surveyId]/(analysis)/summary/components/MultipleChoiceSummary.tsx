import { InboxIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { getContactIdentifier } from "@formbricks/lib/utils/contact";
import { TContactAttributeKey } from "@formbricks/types/contact-attribute-key";
import {
  TI18nString,
  TSurvey,
  TSurveyQuestionId,
  TSurveyQuestionSummaryMultipleChoice,
  TSurveyQuestionTypeEnum,
  TSurveyType,
} from "@formbricks/types/surveys/types";
import { TUserLocale } from "@formbricks/types/user";
import { PersonAvatar } from "@formbricks/ui/components/Avatars";
import { Button } from "@formbricks/ui/components/Button";
import { ProgressBar } from "@formbricks/ui/components/ProgressBar";
import { convertFloatToNDecimal } from "../lib/utils";
import { QuestionSummaryHeader } from "./QuestionSummaryHeader";

interface MultipleChoiceSummaryProps {
  questionSummary: TSurveyQuestionSummaryMultipleChoice;
  environmentId: string;
  surveyType: TSurveyType;
  survey: TSurvey;
  contactAttributeKeys: TContactAttributeKey[];
  setFilter: (
    questionId: TSurveyQuestionId,
    label: TI18nString,
    questionType: TSurveyQuestionTypeEnum,
    filterValue: string,
    filterComboBoxValue?: string | string[]
  ) => void;
  locale: TUserLocale;
}

export const MultipleChoiceSummary = ({
  questionSummary,
  environmentId,
  surveyType,
  survey,
  contactAttributeKeys,
  setFilter,
  locale,
}: MultipleChoiceSummaryProps) => {
  const t = useTranslations();
  const [visibleOtherResponses, setVisibleOtherResponses] = useState(10);
  const otherValue = questionSummary.question.choices.find((choice) => choice.id === "other")?.label.default;
  // sort by count and transform to array
  const results = Object.values(questionSummary.choices).sort((a, b) => {
    if (a.others) return 1; // Always put a after b if a has 'others'
    if (b.others) return -1; // Always put b after a if b has 'others'

    return b.count - a.count; // Sort by count
  });

  const handleLoadMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    const lastChoice = results[results.length - 1];
    const hasOthers = lastChoice.others && lastChoice.others.length > 0;

    if (!hasOthers) return; // If there are no 'others' to show, don't increase the visible options

    // Increase the number of visible responses by 10, not exceeding the total number of responses
    setVisibleOtherResponses((prevVisibleOptions) =>
      Math.min(prevVisibleOptions + 10, lastChoice.others?.length || 0)
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <QuestionSummaryHeader
        questionSummary={questionSummary}
        survey={survey}
        contactAttributeKeys={contactAttributeKeys}
        locale={locale}
        additionalInfo={
          questionSummary.type === "multipleChoiceMulti" ? (
            <div className="flex items-center rounded-lg bg-slate-100 p-2">
              <InboxIcon className="mr-2 h-4 w-4" />
              {`${questionSummary.selectionCount} ${t("common.selections")}`}
            </div>
          ) : undefined
        }
      />
      <div className="space-y-5 px-4 pb-6 pt-4 text-sm md:px-6 md:text-base">
        {results.map((result, resultsIdx) => (
          <div
            key={result.value}
            className="group cursor-pointer"
            onClick={() =>
              setFilter(
                questionSummary.question.id,
                questionSummary.question.headline,
                questionSummary.question.type,
                questionSummary.type === "multipleChoiceSingle" || otherValue === result.value
                  ? t("environments.surveys.summary.includes_either")
                  : t("environments.surveys.summary.includes_all"),
                [result.value]
              )
            }>
            <div className="text flex flex-col justify-between px-2 pb-2 sm:flex-row">
              <div className="mr-8 flex w-full justify-between space-x-1 sm:justify-normal">
                <p className="font-semibold text-slate-700 underline-offset-4 group-hover:underline">
                  {results.length - resultsIdx} - {result.value}
                </p>
                <div>
                  <p className="rounded-lg bg-slate-100 px-2 text-slate-700">
                    {convertFloatToNDecimal(result.percentage, 2)}%
                  </p>
                </div>
              </div>
              <p className="flex w-full pt-1 text-slate-600 sm:items-end sm:justify-end sm:pt-0">
                {result.count} {result.count === 1 ? t("common.selection") : t("common.selections")}
              </p>
            </div>
            <div className="group-hover:opacity-80">
              <ProgressBar barColor="bg-brand-dark" progress={result.percentage / 100} />
            </div>
            {result.others && result.others.length > 0 && (
              <div className="mt-4 rounded-lg border border-slate-200" onClick={(e) => e.stopPropagation()}>
                <div className="grid h-12 grid-cols-2 content-center rounded-t-lg bg-slate-100 text-left text-sm font-semibold text-slate-900">
                  <div className="col-span-1 pl-6">
                    {t("environments.surveys.summary.other_values_found")}
                  </div>
                  <div className="col-span-1 pl-6">{surveyType === "app" && t("common.user")}</div>
                </div>
                {result.others
                  .filter((otherValue) => otherValue.value !== "")
                  .slice(0, visibleOtherResponses)
                  .map((otherValue, idx) => (
                    <div key={idx} dir="auto">
                      {surveyType === "link" && (
                        <div
                          key={idx}
                          className="ph-no-capture col-span-1 m-2 flex h-10 items-center rounded-lg pl-4 text-sm font-medium text-slate-900">
                          <span>{otherValue.value}</span>
                        </div>
                      )}
                      {surveyType === "app" && otherValue.contact && (
                        <Link
                          href={
                            otherValue.contact.id
                              ? `/environments/${environmentId}/people/${otherValue.contact.id}`
                              : { pathname: null }
                          }
                          key={idx}
                          className="m-2 grid h-16 grid-cols-2 items-center rounded-lg text-sm hover:bg-slate-100">
                          <div className="ph-no-capture col-span-1 pl-4 font-medium text-slate-900">
                            <span>{otherValue.value}</span>
                          </div>
                          <div className="ph-no-capture col-span-1 flex items-center space-x-4 pl-6 font-medium text-slate-900">
                            {otherValue.contact.id && <PersonAvatar personId={otherValue.contact.id} />}
                            <span>
                              {getContactIdentifier(otherValue.contact, otherValue.contactAttributes)}
                            </span>
                          </div>
                        </Link>
                      )}
                    </div>
                  ))}
                {visibleOtherResponses < result.others.length && (
                  <div className="flex justify-center py-4">
                    <Button onClick={handleLoadMore} variant="secondary" size="sm">
                      {t("common.load_more")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
