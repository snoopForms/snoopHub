"use client";

import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useProduct } from "@/lib/products/products";
import { cn } from "@/lib/utils";
import type { Template } from "@/types/templates";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { createId } from "@paralleldrive/cuid2";
import Link from "next/link";
import { useState } from "react";
import PreviewSurvey from "../PreviewSurvey";
import TemplateMenuBar from "./TemplateMenuBar";
import { templates } from "./templates";
import { PaintBrushIcon } from "@heroicons/react/24/solid";

export default function TemplateList({ environmentId }: { environmentId: string }) {
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(
    templates.length > 0 ? templates[0] : null
  );
  const { product, isLoadingProduct, isErrorProduct } = useProduct(environmentId);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const categories = [
    "All",
    ...(Array.from(new Set(templates.map((template) => template.category))) as string[]),
  ];

  if (isLoadingProduct) return <LoadingSpinner />;
  if (isErrorProduct) return <div>Error...</div>;

  const customSurvey: Template = {
    name: "Custom Survey",
    description: "Create your survey from scratch.",
    icon: null,
    preset: {
      name: "New Survey",
      questions: [
        {
          id: createId(),
          type: "openText",
          headline: "What's poppin?",
          subheader: "This can help us improve your experience.",
          placeholder: "Type your answer here...",
          required: true,
        },
      ],
    },
  };

  return (
    <div className="flex h-full flex-col">
      <TemplateMenuBar activeTemplate={activeTemplate} environmentId={environmentId} />
      <div className="relative z-0 flex flex-1 overflow-hidden">
        <main className="relative z-0 flex-1 overflow-y-auto px-8 py-6 focus:outline-none">
          <div className="mb-6 flex space-x-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedFilter(category)}
                className={cn(
                  selectedFilter === category
                    ? "text-brand-dark border-brand-dark font-semibold"
                    : "border-slate-300 text-slate-700 hover:bg-slate-100",
                  "rounded border  bg-slate-50 px-3 py-1 text-sm transition-all duration-150 "
                )}>
                {category}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {templates
              .filter((template) => selectedFilter === "All" || template.category === selectedFilter)
              .map((template: Template) => (
                <button
                  type="button"
                  onClick={() => setActiveTemplate(template)}
                  key={template.name}
                  className={cn(
                    activeTemplate?.name === template.name && "ring-brand ring-2",
                    "duration-120  group  relative rounded-lg bg-white p-6 shadow transition-all duration-150 hover:scale-105"
                  )}>
                  <div className="absolute top-6 right-6 rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-500">
                    {template.category}
                  </div>
                  <template.icon className="h-8 w-8" />
                  <h3 className="text-md mt-3 mb-1 text-left font-bold text-slate-700">{template.name}</h3>
                  <p className="text-left text-xs text-slate-600">{template.description}</p>
                </button>
              ))}
            <button
              type="button"
              onClick={() => setActiveTemplate(customSurvey)}
              className={cn(
                activeTemplate?.name === customSurvey.name && "ring-brand ring-2",
                "duration-120 hover:border-brand-dark group relative rounded-lg border-2 border-dashed border-slate-300 bg-transparent p-8 transition-colors duration-150"
              )}>
              <PlusCircleIcon className="text-brand-dark h-8 w-8 transition-all duration-150 group-hover:scale-110" />
              <h3 className="text-md mt-3 mb-1 text-left font-bold text-slate-700 ">{customSurvey.name}</h3>
              <p className="text-left text-xs text-slate-600 ">{customSurvey.description}</p>
            </button>
          </div>
        </main>
        <aside className="group relative hidden h-full flex-1 flex-shrink-0 overflow-hidden border-l border-slate-200 bg-slate-200 shadow-inner md:flex md:flex-col">
          <Link href={`/environments/${environmentId}/settings/lookandfeel`} target="_blank">
            <div className="absolute left-6  top-6 flex items-center rounded bg-slate-50 px-2 py-0.5 text-xs text-slate-500 opacity-0 transition-all delay-1000 duration-500 hover:bg-slate-100 group-hover:opacity-100">
              Update brand color <PaintBrushIcon className="ml-1.5 h-3 w-3" />
            </div>
          </Link>
          {activeTemplate && (
            <PreviewSurvey
              activeQuestionId={null}
              questions={activeTemplate.preset.questions}
              brandColor={product.brandColor}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
