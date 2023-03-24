import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Button from "@/components/ui/Button";
import ErrorComponent from "@/components/ui/ErrorComponent";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { useEventClass, useEventClasses } from "@/lib/eventClasses/eventClasses";
import { useEventClassMutation } from "@/lib/eventClasses/mutateEventClasses";
import { useForm } from "react-hook-form";

interface EventSettingsTabProps {
  environmentId: string;
  eventClassId: string;
  setOpen: (v: boolean) => void;
}

export default function EventSettingsTab({ environmentId, eventClassId, setOpen }: EventSettingsTabProps) {
  const { eventClass, isLoadingEventClass, isErrorEventClass } = useEventClass(environmentId, eventClassId);

  const { register, handleSubmit } = useForm({
    defaultValues: { name: eventClass.name, description: eventClass.description },
  });
  const { triggerEventClassMutate, isMutatingEventClass } = useEventClassMutation(
    environmentId,
    eventClass.id
  );

  const { mutateEventClasses } = useEventClasses(environmentId);

  const onSubmit = async (data) => {
    await triggerEventClassMutate(data);
    mutateEventClasses();
    setOpen(false);
  };

  if (isLoadingEventClass) return <LoadingSpinner />;
  if (isErrorEventClass) return <ErrorComponent />;

  return (
    <div>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="">
          <Label className="text-slate-600">Display name</Label>
          <Input
            type="text"
            placeholder="e.g. Product Team Info"
            {...register("name", {
              value: eventClass.name,
              disabled: eventClass.type === "automatic" || eventClass.type === "code" ? true : false,
            })}
          />
        </div>
        <div className="">
          <Label className="text-slate-600">Display description</Label>
          <Input
            type="text"
            placeholder="e.g. Triggers when user changed subscription"
            {...register("description", {
              value: eventClass.description,
              disabled: eventClass.type === "automatic" ? true : false,
            })}
          />
        </div>
        <div className="my-6">
          <Label>Event Type</Label>
          {eventClass.type === "code" ? (
            <p className="text-sm text-slate-600">
              This is a code event. Please make changes in your code base.
            </p>
          ) : eventClass.type === "noCode" ? (
            <div>
              <Label className="mb-3 mt-1 block font-normal text-slate-500">
                You cannot change the event type. Please add a new event instead.
              </Label>
              <RadioGroup defaultValue="page-url" className="flex">
                <div className="flex items-center space-x-2 rounded-lg  bg-slate-50 p-3">
                  <RadioGroupItem disabled checked value="page-url" id="page-url" className="bg-slate-50" />
                  <Label htmlFor="page-url" className="flex items-center text-slate-400">
                    Page URL
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-lg bg-slate-50 p-3">
                  <RadioGroupItem disabled value="inner-html" id="inner-html" className="bg-slate-50" />
                  <Label htmlFor="inner-html" className="flex items-center text-slate-400">
                    Inner Text
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-lg bg-slate-50 p-3">
                  <RadioGroupItem disabled value="css-selector" id="css-selector" className="bg-slate-50" />
                  <Label htmlFor="css-selector" className="flex items-center text-slate-400">
                    CSS Selector
                  </Label>
                </div>
              </RadioGroup>
            </div>
          ) : eventClass.type === "automatic" ? (
            <p className="text-sm text-slate-600">
              This event was created automatically. You cannot make changes to it.
            </p>
          ) : null}
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-6">
          <div>
            <Button variant="secondary" href="https://formbricks.com/docs" target="_blank">
              Read Docs
            </Button>
          </div>
          {eventClass.type !== "automatic" && (
            <div className="flex space-x-2">
              <Button type="submit" variant="primary" loading={isMutatingEventClass}>
                Save changes
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
