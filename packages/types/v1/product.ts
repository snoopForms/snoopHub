import { z } from "zod";

const ZEnvironment = z.object({
  id: z.string(),
  type: z.enum(["production", "development"]),
});

export const ZProduct = z.object({
  id: z.string().cuid2(),
  createdAt: z.date(),
  updatedAt: z.date(),
  name: z.string(),
  teamId: z.string(),
  brandColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  recontactDays: z.number().int(),
  formbricksSignature: z.boolean(),
  placement: z.enum(["bottomLeft", "bottomRight", "topLeft", "topRight", "center"]),
  clickOutsideClose: z.boolean(),
  darkOverlay: z.boolean(),
  environments: z.array(ZEnvironment),
});

export type TProduct = z.infer<typeof ZProduct>;
