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
