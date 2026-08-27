import type { ZodType, z } from "zod";

import type { Result } from "@/lib/result";

/**
 * One way to validate untrusted input, for every entry point.
 *
 * The Express baseline does this as middleware: `validateResource(schema)` runs
 * before the handler, answers 400 itself, and the handler never sees a bad
 * request. Next has no middleware chain in front of a server action or a route
 * handler, so the same idea arrives as a function the entry point calls on its
 * first line. Same guarantee, same error shape — the difference is that these
 * hand the failure back instead of writing a response, because a server action
 * renders an error into a form while a route handler returns JSON.
 *
 * `safeParse`, never `parse` in a try/catch: a bad request is an expected
 * outcome of a public endpoint, not an exception. Reporting it as a value keeps
 * it on the same footing as every other failure in this codebase — see
 * BookingResult in lib/reservations.ts.
 */
export type ValidationIssue = { path: string; message: string };

export type ValidationError = {
  error: "Validation failed";
  details: ValidationIssue[];
};

/** The first issue's message, for a form that shows one line at a time. */
export const firstMessage = (
  failure: ValidationError,
  fallback = "Check your details.",
): string => failure.details[0]?.message ?? fallback;

const toFailure = (issues: z.core.$ZodIssue[]): ValidationError => ({
  error: "Validation failed",
  details: issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  })),
});

/** Validate an already-parsed object — a JSON body, or search params. */
export const validate = <S extends ZodType>(
  schema: S,
  input: unknown,
): Result<z.infer<S>, ValidationError> => {
  const parsed = schema.safeParse(input);

  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, error: toFailure(parsed.error.issues) };
};

/**
 * Validate a form submission.
 *
 * Only the named fields are read. Taking `Object.fromEntries(formData)` instead
 * would hand every field the browser happened to post straight to the schema,
 * and a schema that later gains an optional field would start accepting it from
 * any form on the site.
 *
 * Everything arrives as a string — that is what a form sends — so schemas that
 * validate form input use `z.coerce` for their number fields.
 */
export const validateFormData = <S extends ZodType>(
  schema: S,
  formData: FormData,
  fields: readonly string[],
): Result<z.infer<S>, ValidationError> =>
  validate(
    schema,
    Object.fromEntries(fields.map((field) => [field, formData.get(field)])),
  );
