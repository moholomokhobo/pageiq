function slugifyPageName(query: string): string {
  return query
    .trim()
    .replace(/^@/, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function isFacebookUrlInput(input: string): boolean {
  const value = input.trim().toLowerCase();
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("facebook.com") ||
    value.startsWith("www.facebook.com") ||
    value.startsWith("m.facebook.com")
  );
}

function normalizeFacebookUrl(input: string): string {
  let url = input.trim();

  if (!/^https?:\/\//i.test(url)) {
    url = url.replace(/^www\./i, "www.");
    if (/^facebook\.com/i.test(url)) {
      url = `https://www.${url}`;
    } else if (/^m\.facebook\.com/i.test(url)) {
      url = `https://${url}`;
    } else {
      url = `https://${url}`;
    }
  }

  const parsed = new URL(url);

  if (!parsed.hostname.includes("facebook.com")) {
    throw new Error("Please enter a valid Facebook page URL.");
  }

  parsed.hostname = parsed.hostname
    .replace(/^m\./i, "www.")
    .replace(/^facebook\.com$/i, "www.facebook.com");

  if (parsed.hostname === "facebook.com") {
    parsed.hostname = "www.facebook.com";
  }

  if (!parsed.hostname.startsWith("www.")) {
    parsed.hostname = `www.${parsed.hostname}`;
  }

  const path = parsed.pathname.replace(/\/+$/, "") || "";
  if (!path || path === "/") {
    throw new Error("Please include a Facebook page name in the URL.");
  }

  return `${parsed.protocol}//${parsed.hostname}${path}`;
}

function titleCase(query: string): string {
  return query
    .trim()
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function resolveFacebookPageUrls(input: string): {
  urls: string[];
  fallbackName: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Please enter a Facebook page URL or name.");
  }

  if (isFacebookUrlInput(trimmed)) {
    const desktopUrl = normalizeFacebookUrl(trimmed);
    const mobileUrl = desktopUrl.replace("www.facebook.com", "m.facebook.com");
    const pathSegment =
      new URL(desktopUrl).pathname.split("/").filter(Boolean)[0] ?? "";

    return {
      urls: [desktopUrl, mobileUrl],
      fallbackName: titleCase(pathSegment.replace(/-/g, " ")),
    };
  }

  const slug = slugifyPageName(trimmed);
  if (!slug) {
    throw new Error("Please enter a valid Facebook page name.");
  }

  return {
    urls: [
      `https://www.facebook.com/${slug}`,
      `https://m.facebook.com/${slug}`,
    ],
    fallbackName: titleCase(trimmed),
  };
}

const TAB_PATH_SUFFIXES = [
  "reels",
  "photos_by",
  "photos",
  "posts",
  "videos",
] as const;

export type FacebookTabUrlCandidate = {
  url: string;
  label: string;
};

/** Canonical profile/page base without tab path segments. */
export function buildFacebookPageBaseUrl(pageUrl: string): string {
  const desktop = normalizeFacebookUrl(pageUrl);
  const parsed = new URL(desktop);
  const segments = parsed.pathname.split("/").filter(Boolean);

  while (
    segments.length > 0 &&
    TAB_PATH_SUFFIXES.includes(
      segments[segments.length - 1]!.toLowerCase() as (typeof TAB_PATH_SUFFIXES)[number]
    )
  ) {
    segments.pop();
  }

  const pageBase = `${parsed.protocol}//${parsed.hostname}${
    segments.length > 0 ? `/${segments.join("/")}` : ""
  }`;
  return pageBase.replace(/\/+$/, "");
}

/** Primary path segment (e.g. ipelengrose.makhooe.1 or Nike). */
export function getFacebookProfileSlug(pageUrl: string): string {
  const segments = new URL(buildFacebookPageBaseUrl(pageUrl)).pathname
    .split("/")
    .filter(Boolean);
  return segments[segments.length - 1] ?? segments[0] ?? "";
}

/**
 * Personal profiles often use dotted usernames or numeric suffixes
 * (e.g. facebook.com/ipelengrose.makhooe.1).
 */
export function isPersonalFacebookProfile(pageUrl: string): boolean {
  const slug = getFacebookProfileSlug(pageUrl);
  if (!slug) return false;
  return slug.includes(".") || /\d/.test(slug);
}

/**
 * Reels tab URL candidates.
 * Personal profiles: /reels/, ?sk=videos_reels, /videos/
 * Pages: /reels/ only
 */
export function buildFacebookReelsTabUrlCandidates(
  pageUrl: string
): FacebookTabUrlCandidate[] {
  const base = buildFacebookPageBaseUrl(pageUrl);

  if (isPersonalFacebookProfile(pageUrl)) {
    const skUrl = new URL(`${base}/`);
    skUrl.search = "";
    skUrl.searchParams.set("sk", "videos_reels");
    return [
      { url: `${base}/reels/`, label: "/reels/" },
      { url: skUrl.toString(), label: "?sk=videos_reels" },
      { url: `${base}/videos/`, label: "/videos/" },
    ];
  }

  return [{ url: `${base}/reels/`, label: "/reels/" }];
}

export function buildFacebookReelsTabUrls(pageUrl: string): string[] {
  return buildFacebookReelsTabUrlCandidates(pageUrl).map((c) => c.url);
}

export function buildFacebookReelsTabUrl(pageUrl: string): string {
  return buildFacebookReelsTabUrls(pageUrl)[0];
}

/**
 * Photos tab URL candidates.
 * Personal profiles: /photos/ then /photos_by/
 * Pages: /photos_by/ then /photos/
 */
export function buildFacebookPhotosTabUrlCandidates(
  pageUrl: string
): FacebookTabUrlCandidate[] {
  const base = buildFacebookPageBaseUrl(pageUrl);

  if (isPersonalFacebookProfile(pageUrl)) {
    return [
      { url: `${base}/photos/`, label: "/photos/" },
      { url: `${base}/photos_by/`, label: "/photos_by/" },
    ];
  }

  return [
    { url: `${base}/photos_by/`, label: "/photos_by/" },
    { url: `${base}/photos/`, label: "/photos/" },
  ];
}

export function buildFacebookPhotosTabUrls(pageUrl: string): string[] {
  return buildFacebookPhotosTabUrlCandidates(pageUrl).map((c) => c.url);
}

export function buildFacebookPhotosTabUrl(pageUrl: string): string {
  return buildFacebookPhotosTabUrls(pageUrl)[0];
}

/**
 * Text posts tab: /{page}/posts/
 */
export function buildFacebookTextPostsTabUrl(pageUrl: string): string {
  return `${buildFacebookPageBaseUrl(pageUrl)}/posts/`;
}
