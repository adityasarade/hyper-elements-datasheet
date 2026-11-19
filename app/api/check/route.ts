import { checkPreview, readSubmission, requestError } from "../datasheet";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const submission = await readSubmission(request);
  if (submission instanceof Response) return submission;
  try {
    return Response.json(await checkPreview(submission.values, submission.format));
  } catch (error) {
    console.error("Datasheet check failed", error);
    return requestError(500, "studio/check", "The preview could not be checked. Try again.");
  }
}
