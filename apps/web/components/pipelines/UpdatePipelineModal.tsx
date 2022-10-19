import { persistPipeline, usePipeline, usePipelines } from "../../lib/pipelines";
import Loading from "../Loading";
import Modal from "../Modal";
import PipelineSettings from "./PipelineSettings";

export default function UpdatePipelineModal({ open, setOpen, formId, pipelineId }) {
  const { pipeline, isLoadingPipeline, mutatePipeline } = usePipeline(formId, pipelineId);
  const { pipelines, mutatePipelines } = usePipelines(formId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await persistPipeline(pipeline);
    const newPipelines = JSON.parse(JSON.stringify(pipelines));
    const pipelineIdx = pipelines.findIndex((p) => p.id === pipelineId);
    if (pipelineIdx > -1) {
      newPipelines[pipelineIdx] = pipeline;
      mutatePipelines(newPipelines);
    }
    setOpen(false); 
  };

  return (
    <Modal open={open} setOpen={setOpen}>
      {isLoadingPipeline ? (
        <Loading />
      ) : (
        <form
          className="w-full space-y-8 divide-y divide-gray-200"
          onSubmit={handleSubmit}
        >
          <PipelineSettings typeId={pipeline.type } pipeline={pipeline} setPipeline={(p) => mutatePipeline(p, false)} /> 
          <div className="pt-5">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                Cancel
              </button>
              <button
                type="submit"
                className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                Update
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
