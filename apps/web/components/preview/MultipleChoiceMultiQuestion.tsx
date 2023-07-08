import { Input } from "@/../../packages/ui";
import SubmitButton from "@/components/preview/SubmitButton";
import { cn } from "@formbricks/lib/cn";
import type { MultipleChoiceMultiQuestion } from "@formbricks/types/questions";
import { useEffect, useState } from "react";
import Headline from "./Headline";
import Subheader from "./Subheader";
import _ from "lodash";

interface MultipleChoiceMultiProps {
  question: MultipleChoiceMultiQuestion;
  onSubmit: (data: { [x: string]: any }) => void;
  lastQuestion: boolean;
  brandColor: string;
  savedAnswer: string[] | null;
  goToNextQuestion: () => void;
}

export default function MultipleChoiceMultiQuestion({
  question,
  onSubmit,
  lastQuestion,
  brandColor,
  savedAnswer,
  goToNextQuestion,
}: MultipleChoiceMultiProps) {
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const [isAtLeastOneChecked, setIsAtLeastOneChecked] = useState(false);
  const [showOther, setShowOther] = useState(false);
  const [otherSpecified, setOtherSpecified] = useState("");

  const nonOtherChoiceLabels = question.choices
    .map((choice) => choice.label)
    .filter((label) => label !== "Other");

  useEffect(() => {
    const nonOtherSavedChoices = savedAnswer?.filter((answer) => nonOtherChoiceLabels.includes(answer));
    const savedOtherSpecified = savedAnswer?.find((answer) => !nonOtherChoiceLabels.includes(answer));

    setSelectedChoices(nonOtherSavedChoices ?? []);

    if (savedOtherSpecified) {
      setOtherSpecified(savedOtherSpecified);
      setShowOther(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*   
  const [isIphone, setIsIphone] = useState(false);
  useEffect(() => {
    setIsIphone(/iPhone|iPad|iPod/.test(navigator.userAgent));
  }, []); 
  */

  useEffect(() => {
    setIsAtLeastOneChecked(selectedChoices.length > 0 || otherSpecified.length > 0);
  }, [selectedChoices, otherSpecified]);

  const handleSubmit = () => {
    if (question.required && selectedChoices.length <= 0) {
      return;
    }

    const data = {
      [question.id]: selectedChoices,
    };

    onSubmit(data);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        if (otherSpecified.length > 0 && showOther) {
          selectedChoices.push(otherSpecified);
        }

        // checks if the saved answer is the same as the selected choices
        if (_.xor(selectedChoices, savedAnswer).length === 0) {
          goToNextQuestion();
          return;
        }

        handleSubmit();
      }}>
      <Headline headline={question.headline} questionId={question.id} />
      <Subheader subheader={question.subheader} questionId={question.id} />
      <div className="mt-4">
        <fieldset>
          <legend className="sr-only">Options</legend>
          <div className="xs:max-h-[41vh] relative max-h-[60vh] space-y-2 overflow-y-auto rounded-md py-0.5 pr-2">
            {question.choices &&
              question.choices.map((choice) => (
                <div key={choice.id}>
                  <label
                    key={choice.id}
                    className={cn(
                      selectedChoices.includes(choice.label) || (choice.id === "other" && showOther)
                        ? "z-10 border-slate-400 bg-slate-50"
                        : "border-gray-200",
                      "relative flex cursor-pointer flex-col rounded-md border p-4 hover:bg-slate-50 focus:outline-none"
                    )}>
                    <span className="flex flex-col text-sm">
                      <span className="flex items-center">
                        <input
                          type="checkbox"
                          id={choice.id}
                          name={question.id}
                          value={choice.label}
                          className="h-4 w-4 border border-slate-300 focus:ring-0 focus:ring-offset-0"
                          aria-labelledby={`${choice.id}-label`}
                          checked={
                            selectedChoices.includes(choice.label) || (choice.id === "other" && showOther)
                          }
                          onChange={(e) => {
                            if (choice.id === "other") {
                              setShowOther(e.currentTarget.checked);
                              return;
                            }

                            if (e.currentTarget.checked) {
                              setSelectedChoices([...selectedChoices, e.currentTarget.value]);
                            } else {
                              setSelectedChoices(
                                selectedChoices.filter((label) => label !== e.currentTarget.value)
                              );
                            }
                          }}
                          style={{ borderColor: brandColor, color: brandColor }}
                        />
                        <span id={`${choice.id}-label`} className="ml-3 font-medium">
                          {choice.label}
                        </span>
                      </span>
                      {choice.id === "other" && showOther && (
                        <Input
                          id={`${choice.id}-label`}
                          name={question.id}
                          className="mt-2 bg-white focus:border-slate-300"
                          placeholder="Please specify"
                          value={otherSpecified}
                          onChange={(e) => setOtherSpecified(e.currentTarget.value)}
                          aria-labelledby={`${choice.id}-label`}
                          required={question.required}
                          autoFocus
                        />
                      )}
                    </span>
                  </label>
                </div>
              ))}
          </div>
        </fieldset>
      </div>
      <input
        type="text"
        className="clip-[rect(0,0,0,0)] absolute m-[-1px] h-1 w-1 overflow-hidden whitespace-nowrap border-0 p-0 text-transparent caret-transparent focus:border-transparent focus:ring-0"
        required={question.required}
        value={isAtLeastOneChecked ? "checked" : ""}
        onChange={() => {}}
      />
      <div className="mt-4 flex w-full justify-between">
        <div></div>
        <SubmitButton {...{ question, lastQuestion, brandColor }} />
      </div>
    </form>
  );
}
