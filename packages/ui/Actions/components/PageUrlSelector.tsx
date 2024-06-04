import { Label } from "@radix-ui/react-dropdown-menu";
import { Globe, PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { Control, FieldArrayWithId, UseFieldArrayRemove, useFieldArray } from "react-hook-form";
import { UseFormReturn } from "react-hook-form";
import toast from "react-hot-toast";

import { cn } from "@formbricks/lib/cn";
import { testURLmatch } from "@formbricks/lib/utils/testUrlMatch";
import { TActionClassInput, TActionClassPageUrlRule } from "@formbricks/types/actionClasses";

import { Alert, AlertDescription, AlertTitle } from "../../Alert";
import { Button } from "../../Button";
import { FormControl, FormField, FormItem } from "../../Form";
import { Input } from "../../Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../Select";
import { TabToggle } from "../../TabToggle";

interface PageUrlSelectorProps {
  form: UseFormReturn<TActionClassInput>;
}

export const PageUrlSelector = ({ form }: PageUrlSelectorProps) => {
  const [testUrl, setTestUrl] = useState("");
  const [isMatch, setIsMatch] = useState("");

  const filterType = form.watch("noCodeConfig.urlFilters")?.length ? "specific" : "all";

  const setFilterType = (value: string) => {
    form.setValue("noCodeConfig.urlFilters", value === "all" ? [] : [{ rule: "exactMatch", value: "" }]);
  };

  const handleMatchClick = () => {
    const match =
      form.watch("noCodeConfig.urlFilters")?.some((urlFilter) => {
        const res =
          testURLmatch(testUrl, urlFilter.value, urlFilter.rule as TActionClassPageUrlRule) === "yes";
        return res;
      }) || false;

    const isMatch = match ? "yes" : "no";

    setIsMatch(isMatch);
    if (isMatch === "yes") toast.success("Your survey would be shown on this URL.");
    if (isMatch === "no") toast.error("Your survey would not be shown.");
  };

  const {
    fields,
    append: appendUrlRule,
    remove: removeUrlRule,
  } = useFieldArray({
    control: form.control,
    name: "noCodeConfig.urlFilters",
  });

  const handleAddMore = () => {
    appendUrlRule({ rule: "exactMatch", value: "" });
  };

  return (
    <>
      <div className="mt-4 w-4/5">
        <FormField
          control={form.control}
          name="noCodeConfig.urlFilters"
          render={() => (
            <TabToggle
              id="filter"
              label="Filter"
              subLabel="Limit the pages on which this action gets captured"
              onChange={(value) => {
                setFilterType(value);
              }}
              options={[
                { value: "all", label: "On all pages" },
                { value: "specific", label: "Limit to specific pages" },
              ]}
              defaultSelected={filterType}
            />
          )}
        />
      </div>
      {filterType === "specific" ? (
        <div className={`ml-2 mt-4 flex  items-center space-x-1 rounded-lg border bg-slate-50`}>
          <div className="col-span-1 w-full space-y-3 p-4">
            <Label>URL</Label>
            <UrlInput control={form.control} fields={fields} removeUrlRule={removeUrlRule} />
            <Button variant="secondary" size="sm" type="button" onClick={handleAddMore}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add URL
            </Button>
            <div className="pt-4">
              <div className="text-sm text-slate-900">Test your URL</div>
              <div className="text-xs text-slate-400">
                Enter a URL to see if a user visiting it would be tracked.
              </div>
              <div className=" rounded bg-slate-50">
                <div className="mt-1 flex items-end">
                  <Input
                    type="text"
                    value={testUrl}
                    name="noCodeConfig.urlFilters.testUrl"
                    onChange={(e) => {
                      setTestUrl(e.target.value);
                      setIsMatch("default");
                    }}
                    className={cn(
                      isMatch === "yes"
                        ? "border-green-500 bg-green-50"
                        : isMatch === "no"
                          ? "border-red-200 bg-red-50"
                          : isMatch === "default"
                            ? "border-slate-200"
                            : "bg-white"
                    )}
                    placeholder="e.g. https://app.com/dashboard"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="ml-2 whitespace-nowrap"
                    onClick={() => {
                      handleMatchClick();
                    }}>
                    Test Match
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Alert className="my-2 bg-slate-100">
          <Globe className="h-4 w-4" />
          <AlertTitle>Visible on all pages</AlertTitle>
          <AlertDescription>This action will be captured on all pages of your website</AlertDescription>
        </Alert>
      )}
    </>
  );
};

const UrlInput = ({
  control,
  fields,
  removeUrlRule,
}: {
  control: Control<TActionClassInput>;
  fields: FieldArrayWithId<TActionClassInput, "noCodeConfig.urlFilters", "id">[];
  removeUrlRule: UseFieldArrayRemove;
}) => {
  return (
    <div className="flex w-full flex-col gap-2">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center space-x-2">
          <FormField
            name={`noCodeConfig.urlFilters.${index}.rule`}
            control={control}
            render={({ field: { onChange, value, name } }) => (
              <FormItem>
                <FormControl>
                  <Select onValueChange={onChange} value={value} name={name}>
                    <SelectTrigger className="w-[250px] bg-white">
                      <SelectValue placeholder="Select match type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="exactMatch">Exactly matches</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="startsWith">Starts with</SelectItem>
                      <SelectItem value="endsWith">Ends with</SelectItem>
                      <SelectItem value="notMatch">Does not exactly match</SelectItem>
                      <SelectItem value="notContains">Does not contain</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`noCodeConfig.urlFilters.${index}.value`}
            render={({ field, fieldState: { error } }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    type="text"
                    className="bg-white"
                    {...field}
                    placeholder="e.g. https://app.com/dashboard"
                    autoComplete="off"
                    isInvalid={!!error?.message}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {fields.length > 1 && (
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                removeUrlRule(index);
              }}>
              <TrashIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};
