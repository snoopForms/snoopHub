import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import type { EventClass } from "@prisma/client";

interface SettingsTabProps {
  eventClass: EventClass;
}

export default function SettingsTab({ eventClass }: SettingsTabProps) {
  return (
    <div>
      <form className="space-y-4">
        <div className="">
          <Label className="text-slate-600">Display name</Label>
          <Input type="text" placeholder="e.g. Product Team Info" defaultValue={eventClass.name} />
        </div>
        <div className="">
          <Label className="text-slate-600">Display description</Label>
          <Input
            type="text"
            placeholder="e.g. Triggers when user changed subscription"
            defaultValue={eventClass.description || ""}
          />
        </div>
        <div className="my-6">
          <div>
            <Label>Event Type</Label>
            <Label className="mb-2 block font-normal text-slate-500">
              You cannot change the event type. Please add a new event instead.
            </Label>
            <RadioGroup defaultValue="page-url" className="flex">
              <div className="flex items-center space-x-2 rounded-lg border border-slate-200 p-3">
                <RadioGroupItem disabled checked value="page-url" id="page-url" className="bg-slate-50" />
                <Label htmlFor="page-url" className="flex items-center">
                  Page URL
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border border-slate-200 p-3">
                <RadioGroupItem disabled value="inner-html" id="inner-html" className="bg-slate-50" />
                <Label htmlFor="inner-html" className="flex items-center">
                  Inner Text
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border border-slate-200 p-3">
                <RadioGroupItem disabled value="css-selector" id="css-selector" className="bg-slate-50" />
                <Label htmlFor="css-selector" className="flex items-center">
                  CSS Selector
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </form>
    </div>
  );
}
