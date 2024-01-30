"use client";

import clsx from "clsx";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import * as React from "react";

import useClickOutside from "@formbricks/lib/useClickOutside";
import { TSurveyQuestionType } from "@formbricks/types/surveys";
import { Command, CommandEmpty, CommandGroup, CommandItem } from "@formbricks/ui/Command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@formbricks/ui/DropdownMenu";

type QuestionFilterComboBoxProps = {
  filterOptions: string[] | undefined;
  filterComboBoxOptions: string[] | undefined;
  filterValue: string | undefined;
  filterComboBoxValue: string | string[] | undefined;
  onChangeFilterValue: (o: string) => void;
  onChangeFilterComboBoxValue: (o: string | string[]) => void;
  type: TSurveyQuestionType | "Attributes" | "Tags" | undefined;
  handleRemoveMultiSelect: (value: string[]) => void;
  disabled?: boolean;
};

const QuestionFilterComboBox = ({
  filterComboBoxOptions,
  filterComboBoxValue,
  filterOptions,
  filterValue,
  onChangeFilterComboBoxValue,
  onChangeFilterValue,
  type,
  handleRemoveMultiSelect,
  disabled = false,
}: QuestionFilterComboBoxProps) => {
  const [open, setOpen] = React.useState(false);
  const [openFilterValue, setOpenFilterValue] = React.useState<boolean>(false);
  const commandRef = React.useRef(null);
  useClickOutside(commandRef, () => setOpen(false));

  // multiple when question type is multi selection
  const isMultiple =
    type === TSurveyQuestionType.MultipleChoiceMulti || type === TSurveyQuestionType.MultipleChoiceSingle;

  // when question type is multi selection so we remove the option from the options which has been already selected
  const options = isMultiple
    ? filterComboBoxOptions?.filter((o) => !filterComboBoxValue?.includes(o))
    : filterComboBoxOptions;

  // disable the combo box for selection of value when question type is nps or rating and selected value is submitted or skipped
  const isDisabledComboBox =
    (type === TSurveyQuestionType.NPS || type === TSurveyQuestionType.Rating) &&
    (filterValue === "Submitted" || filterValue === "Skipped");

  return (
    <div className="inline-flex w-full flex-row">
      {filterOptions && filterOptions?.length <= 1 ? (
        <div className="h-9 max-w-fit rounded-md rounded-r-none border-r-[1px] border-slate-300 bg-white p-2 text-sm text-slate-600">
          <p className="mr-1 max-w-[50px] truncate text-slate-600 sm:max-w-[100px]">{filterValue}</p>
        </div>
      ) : (
        <DropdownMenu
          onOpenChange={(value) => {
            value && setOpen(false);
            setOpenFilterValue(value);
          }}>
          <DropdownMenuTrigger
            disabled={disabled}
            className={clsx(
              "h-9 max-w-fit rounded-md rounded-r-none border-r-[1px] border-slate-300 bg-white p-2 text-sm text-slate-600 focus:outline-transparent focus:ring-0",
              !disabled ? "cursor-pointer" : "opacity-50"
            )}>
            <div className="flex items-center justify-between">
              {!filterValue ? (
                <p className="text-slate-400">Select...</p>
              ) : (
                <p className="mr-1 max-w-[50px] truncate text-slate-600 sm:max-w-[80px]">{filterValue}</p>
              )}
              {filterOptions && filterOptions.length > 1 && (
                <>
                  {openFilterValue ? (
                    <ChevronUp className="ml-2 h-4 w-4 opacity-50" />
                  ) : (
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  )}
                </>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white p-2">
            {filterOptions?.map((o, index) => (
              <DropdownMenuItem
                key={`${o}-${index}`}
                className="px-0.5 py-1 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-700"
                onClick={() => onChangeFilterValue(o)}>
                {o}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Command ref={commandRef} className="h-10 overflow-visible bg-transparent">
        <div
          onClick={() => !disabled && !isDisabledComboBox && filterValue && setOpen(true)}
          className={clsx(
            "group flex items-center justify-between rounded-md rounded-l-none bg-white  px-3 py-2 text-sm",
            disabled || isDisabledComboBox || !filterValue ? "opacity-50" : "cursor-pointer"
          )}>
          {filterComboBoxValue && filterComboBoxValue?.length > 0 ? (
            !isMultiple ? (
              <p className="text-slate-600">{filterComboBoxValue}</p>
            ) : (
              <div className="no-scrollbar flex w-[7rem] gap-3 overflow-auto md:w-[10rem] lg:w-[18rem]">
                {typeof filterComboBoxValue !== "string" &&
                  filterComboBoxValue?.map((o) => (
                    <button
                      type="button"
                      onClick={() => handleRemoveMultiSelect(filterComboBoxValue.filter((i) => i !== o))}
                      className="w-30 flex items-center whitespace-nowrap bg-slate-100 px-2 text-slate-600">
                      {o}
                      <X width={14} height={14} className="ml-2" />
                    </button>
                  ))}
              </div>
            )
          ) : (
            <p className="text-slate-400">Select...</p>
          )}
          <div>
            {open ? (
              <ChevronUp className="ml-2 h-4 w-4 opacity-50" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            )}
          </div>
        </div>
        <div className="relative mt-2 h-full">
          {open && (
            <div className="animate-in bg-popover absolute top-0 z-10 max-h-52 w-full overflow-auto rounded-md bg-white outline-none">
              <CommandEmpty>No result found.</CommandEmpty>
              <CommandGroup>
                {options?.map((o) => (
                  <CommandItem
                    onSelect={() => {
                      !isMultiple
                        ? onChangeFilterComboBoxValue(o)
                        : onChangeFilterComboBoxValue(
                            Array.isArray(filterComboBoxValue) ? [...filterComboBoxValue, o] : [o]
                          );
                      !isMultiple && setOpen(false);
                    }}
                    className="cursor-pointer">
                    {o}
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          )}
        </div>
      </Command>
    </div>
  );
};

export default QuestionFilterComboBox;
