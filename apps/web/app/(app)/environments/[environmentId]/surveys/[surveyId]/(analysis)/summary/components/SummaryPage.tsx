"use client";

import { useResponseFilter } from "@/app/(app)/environments/[environmentId]/components/ResponseFilterContext";
import {
  getResponseCountAction,
  getSurveySummaryAction,
} from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/actions";
import ScrollToTop from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/ScrollToTop";
import { SummaryDropOffs } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/SummaryDropOffs";
import { CustomFilter } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/components/CustomFilter";
import { ResultsShareButton } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/components/ResultsShareButton";
import { getFormattedFilters } from "@/app/lib/surveys/surveys";
import {
  getResponseCountBySurveySharingKeyAction,
  getSummaryBySurveySharingKeyAction,
} from "@/app/share/[sharingKey]/actions";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useIntervalWhenFocused } from "@formbricks/lib/utils/hooks/useIntervalWhenFocused";
import { replaceHeadlineRecall } from "@formbricks/lib/utils/recall";
import { TAttributeClass } from "@formbricks/types/attribute-classes";
import { TEnvironment } from "@formbricks/types/environment";
import { TSurvey, TSurveySummary } from "@formbricks/types/surveys/types";
import { TUser } from "@formbricks/types/user";
import { SummaryList } from "./SummaryList";
import { SummaryMetadata } from "./SummaryMetadata";

const initialSurveySummary: TSurveySummary = {
  meta: {
    completedPercentage: 0,
    completedResponses: 0,
    displayCount: 0,
    dropOffPercentage: 0,
    dropOffCount: 0,
    startsPercentage: 0,
    totalResponses: 0,
    ttcAverage: 0,
  },
  dropOff: [],
  summary: [],
};

interface SummaryPageProps {
  environment: TEnvironment;
  survey: TSurvey;
  surveyId: string;
  webAppUrl: string;
  user?: TUser;
  totalResponseCount: number;
  attributeClasses: TAttributeClass[];
  isAIEnabled: boolean;
  documentsPerPage?: number;
}

export const SummaryPage = ({
  environment,
  survey,
  surveyId,
  webAppUrl,
  totalResponseCount,
  attributeClasses,
  isAIEnabled,
  documentsPerPage,
}: SummaryPageProps) => {
  const params = useParams();
  const sharingKey = params.sharingKey as string;
  const isSharingPage = !!sharingKey;

  const searchParams = useSearchParams();
  const isShareEmbedModalOpen = searchParams.get("share") === "true";

  const [responseCount, setResponseCount] = useState<number | null>(null);
  const [surveySummary, setSurveySummary] = useState<TSurveySummary>(initialSurveySummary);
  const [showDropOffs, setShowDropOffs] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const { selectedFilter, dateRange, resetState } = useResponseFilter();

  const filters = useMemo(
    () => getFormattedFilters(survey, selectedFilter, dateRange),
    [selectedFilter, dateRange]
  );

  // Use a ref to keep the latest state and props
  const latestFiltersRef = useRef(filters);
  latestFiltersRef.current = filters;

  const getResponseCount = () => {
    if (isSharingPage)
      return getResponseCountBySurveySharingKeyAction({
        sharingKey,
        filterCriteria: latestFiltersRef.current,
      });
    return getResponseCountAction({
      surveyId,
      filterCriteria: latestFiltersRef.current,
    });
  };

  const getSummary = () => {
    if (isSharingPage)
      return getSummaryBySurveySharingKeyAction({
        sharingKey,
        filterCriteria: latestFiltersRef.current,
      });

    return getSurveySummaryAction({
      surveyId,
      filterCriteria: latestFiltersRef.current,
    });
  };

  const handleInitialData = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoading(true);
    }

    try {
      const [updatedResponseCountData, updatedSurveySummary] = await Promise.all([
        getResponseCount(),
        getSummary(),
      ]);

      const responseCount = updatedResponseCountData?.data ?? 0;
      const surveySummary = updatedSurveySummary?.data ?? initialSurveySummary;

      // Update the state with new data
      setResponseCount(responseCount);
      setSurveySummary(surveySummary);
    } catch (error) {
      console.error(error);
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    handleInitialData(true);
  }, [JSON.stringify(filters), isSharingPage, sharingKey, surveyId]);

  useIntervalWhenFocused(
    () => {
      handleInitialData(false);
    },
    10000,
    !isShareEmbedModalOpen,
    false
  );

  const surveyMemoized = useMemo(() => {
    return replaceHeadlineRecall(survey, "default", attributeClasses);
  }, [survey, attributeClasses]);

  useEffect(() => {
    if (!searchParams?.get("referer")) {
      resetState();
    }
  }, [searchParams, resetState]);

  return (
    <>
      <SummaryMetadata
        surveySummary={surveySummary.meta}
        showDropOffs={showDropOffs}
        setShowDropOffs={setShowDropOffs}
        isLoading={isLoading}
      />
      {showDropOffs && <SummaryDropOffs dropOff={surveySummary.dropOff} />}
      <div className="flex gap-1.5">
        <CustomFilter survey={surveyMemoized} />
        {!isSharingPage && <ResultsShareButton survey={surveyMemoized} webAppUrl={webAppUrl} />}
      </div>
      <ScrollToTop containerId="mainContent" />
      <SummaryList
        summary={surveySummary.summary}
        responseCount={responseCount}
        survey={surveyMemoized}
        environment={environment}
        totalResponseCount={totalResponseCount}
        attributeClasses={attributeClasses}
        isAIEnabled={isAIEnabled}
        documentsPerPage={documentsPerPage}
      />
    </>
  );
};
