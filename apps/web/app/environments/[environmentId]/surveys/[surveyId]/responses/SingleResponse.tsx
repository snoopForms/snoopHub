"use client";

import DeleteDialog from "@/components/shared/DeleteDialog";
import { timeSince } from "@formbricks/lib/time";
import { PersonAvatar, TooltipContent, TooltipProvider, TooltipTrigger, Tooltip } from "@formbricks/ui";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { RatingResponse } from "../RatingResponse";
import { deleteSubmission, useResponses } from "@/lib/responses/responses";
import clsx from "clsx";
import ResponseNote from "./ResponseNote";
import { ReactNode } from "react";
import { QuestionType } from "@formbricks/types/questions";

export interface OpenTextSummaryProps {
  data: {
    id: string;
    personId: string;
    surveyId: string;
    person: {
      id: string;
      createdAt: string;
      updatedAt: string;
      environmentId: string;
      attributes: [];
    };
    personAttributes: {
      [key: string]: string;
    };
    responseNotes: {
      updatedAt: string;
      createdAt: string;
      id: string;
      text: string;
      user: {
        name: string;
      };
    }[];
    value: string;
    updatedAt: string;
    finished: boolean;
    responses: {
      id: string;
      question: string;
      answer: string | any[];
      type: string;
      scale?: "number" | "star" | "smiley";
      range?: number;
    }[];
    meta?: {
      userAgent?: {
        browser?: string;
        os?: string;
        device?: string;
      };
    };
  };
  environmentId: string;
  surveyId: string;
}

function findEmail(person) {
  const emailAttribute = person.attributes.find((attr) => attr.attributeClass.name === "email");
  return emailAttribute ? emailAttribute.value : null;
}

interface TooltipRendererProps {
  shouldRender: boolean;
  tooltipContent: ReactNode;
  children: ReactNode;
}

function TooltipRenderer(props: TooltipRendererProps) {
  const { children, shouldRender, tooltipContent } = props;
  if (shouldRender) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>{children}</TooltipTrigger>
          <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <>{children}</>;
}

export default function SingleResponse({ data, environmentId, surveyId }: OpenTextSummaryProps) {
  const email = data.person && findEmail(data.person);
  const displayIdentifier = email || data.personId;
  const responseNotes = data?.responseNotes;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { mutateResponses } = useResponses(environmentId, surveyId);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDeleteSubmission = async () => {
    setIsDeleting(true);
    const deleteResponse = await deleteSubmission(environmentId, data?.surveyId, data?.id);
    mutateResponses();
    if (deleteResponse?.id?.length > 0) toast.success("Submission deleted successfully.");
    setDeleteDialogOpen(false);
    setIsDeleting(false);
  };

  const hasPersonAttribute = Boolean(data.personAttributes && Object.keys(data.personAttributes).length);

  const hasUserAgentData = Boolean(data.meta?.userAgent && Object.keys(data.meta.userAgent).length);

  const tooltipContent = (
    <>
      {hasPersonAttribute &&
        Object.keys(data.personAttributes).map((key) => (
          <p key={key}>
            {key}: <span className="font-bold">{data.personAttributes[key]}</span>
          </p>
        ))}

      {hasUserAgentData && (
        <div className="text-slate-600">
          <b>Device info</b>
          {data.meta?.userAgent?.browser && <p>Browser: {data.meta.userAgent.browser}</p>}
          {data.meta?.userAgent?.os && <p>OS: {data.meta.userAgent.os}</p>}
          {data.meta?.userAgent?.device && <p>Device: {data.meta.userAgent.device}</p>}
          {data.meta?.userAgent && (
            <p>Device: {data.meta.userAgent.device ? data.meta.userAgent.device : "PC / Generic device"}</p>
          )}
        </div>
      )}
    </>
  );

  const shouldRenderTooltip = hasPersonAttribute || hasUserAgentData;
  return (
    <div className={clsx("group relative", isOpen && "min-h-[300px]")}>
      <div
        className={clsx(
          "relative z-10 my-6 rounded-lg border border-slate-200 bg-slate-50 shadow-sm transition-all",
          isOpen ? "w-3/4" : responseNotes.length ? "w-[96.5%]" : "w-full group-hover:w-[96.5%]"
        )}>
        <div className="space-y-2 px-6 pb-5 pt-6">
          <div className="flex items-center justify-between">
            {data.personId ? (
              <Link
                className="group flex items-center"
                href={`/environments/${environmentId}/people/${data.personId}`}>
                <TooltipRenderer shouldRender={shouldRenderTooltip} tooltipContent={tooltipContent}>
                  <PersonAvatar personId={data.personId} />
                </TooltipRenderer>
                <h3 className="ph-no-capture ml-4 pb-1 font-semibold text-slate-600 hover:underline">
                  {displayIdentifier}
                </h3>
              </Link>
            ) : (
              <div className="group flex items-center">
                <TooltipRenderer shouldRender={shouldRenderTooltip} tooltipContent={tooltipContent}>
                  <PersonAvatar personId="anonymous" />
                </TooltipRenderer>
                <h3 className="ml-4 pb-1 font-semibold text-slate-600">Anonymous</h3>
              </div>
            )}

            <div className="flex space-x-4 text-sm">
              {data.finished && (
                <span className="flex items-center rounded-full bg-slate-100 px-3 text-slate-600">
                  Completed <CheckCircleIcon className="ml-1 h-5 w-5 text-green-400" />
                </span>
              )}
              <time className="text-slate-500" dateTime={timeSince(data.updatedAt)}>
                {timeSince(data.updatedAt)}
              </time>
              <button
                onClick={() => {
                  setDeleteDialogOpen(true);
                }}>
                <TrashIcon className="h-4 w-4 text-slate-500 hover:text-red-700" />
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-6 rounded-b-lg bg-white p-6">
          {data.responses.map((response, idx) => (
            <div key={`${response.id}-${idx}`}>
              <p className="text-sm text-slate-500">{response.question}</p>
              {typeof response.answer !== "object" ? (
                response.type === QuestionType.Rating ? (
                  <div className="h-8">
                    <RatingResponse scale={response.scale} answer={response.answer} range={response.range} />
                  </div>
                ) : (
                  <p className="ph-no-capture my-1 font-semibold text-slate-700">{response.answer}</p>
                )
              ) : (
                <p className="ph-no-capture my-1 font-semibold text-slate-700">
                  {response.answer.join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
        <DeleteDialog
          open={deleteDialogOpen}
          setOpen={setDeleteDialogOpen}
          deleteWhat="response"
          onDelete={handleDeleteSubmission}
          isDeleting={isDeleting}
        />
      </div>
      <ResponseNote
        data={data}
        environmentId={environmentId}
        surveyId={surveyId}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    </div>
  );
}
