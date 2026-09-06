import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(50, "Display name must be 50 characters or less.")
    .optional(),
  bio: z
    .string()
    .trim()
    .max(160, "Bio must be 160 characters or less.")
    .optional(),
  avatarUrl: z
    .string()
    .trim()
    .url("Please enter a valid image URL.")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
