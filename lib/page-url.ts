import { resolveFacebookPageUrls } from "@/lib/facebook-page-url";

export function normalizePageUrl(input: string): string {
  const { urls } = resolveFacebookPageUrls(input);
  return urls[0];
}
