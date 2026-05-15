/** Canonical display names for countries we recognize in page metadata. */
const COUNTRY_ALIASES: Record<string, string> = {
  usa: "USA",
  us: "USA",
  "u.s.": "USA",
  "u.s.a.": "USA",
  "united states": "USA",
  "united states of america": "USA",
  america: "USA",
  uk: "UK",
  "u.k.": "UK",
  "united kingdom": "UK",
  "great britain": "UK",
  britain: "UK",
  england: "UK",
  scotland: "UK",
  wales: "UK",
  "northern ireland": "UK",
  "south africa": "South Africa",
  rsa: "South Africa",
  nigeria: "Nigeria",
  kenya: "Kenya",
  australia: "Australia",
  canada: "Canada",
  india: "India",
  germany: "Germany",
  france: "France",
  brazil: "Brazil",
  mexico: "Mexico",
  uae: "UAE",
  "united arab emirates": "UAE",
  ireland: "Ireland",
  ghana: "Ghana",
  egypt: "Egypt",
  philippines: "Philippines",
  indonesia: "Indonesia",
  pakistan: "Pakistan",
  bangladesh: "Bangladesh",
  japan: "Japan",
  china: "China",
  italy: "Italy",
  spain: "Spain",
  netherlands: "Netherlands",
  belgium: "Belgium",
  portugal: "Portugal",
  poland: "Poland",
  turkey: "Turkey",
  "türkiye": "Turkey",
  israel: "Israel",
  "new zealand": "New Zealand",
  singapore: "Singapore",
  malaysia: "Malaysia",
  thailand: "Thailand",
  vietnam: "Vietnam",
  colombia: "Colombia",
  argentina: "Argentina",
  chile: "Chile",
  peru: "Peru",
  morocco: "Morocco",
  tanzania: "Tanzania",
  uganda: "Uganda",
  ethiopia: "Ethiopia",
  zimbabwe: "Zimbabwe",
  namibia: "Namibia",
  botswana: "Botswana",
  zambia: "Zambia",
  mozambique: "Mozambique",
};

/** Longest phrases first so "South Africa" wins over "Africa". */
const TEXT_COUNTRY_PHRASES = Object.entries(COUNTRY_ALIASES)
  .sort((a, b) => b[0].length - a[0].length);

function titleCaseCountry(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalizeCountryToken(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed || trimmed.length > 60) return null;

  const lower = trimmed.toLowerCase();
  if (COUNTRY_ALIASES[lower]) return COUNTRY_ALIASES[lower];

  for (const [phrase, canonical] of TEXT_COUNTRY_PHRASES) {
    if (lower === phrase) return canonical;
  }

  if (/^[A-Za-z][A-Za-z\s.'-]{1,48}$/.test(trimmed) && !/\d/.test(trimmed)) {
    return titleCaseCountry(trimmed);
  }

  return null;
}

export function extractCountryFromText(text: string): string | null {
  if (!text?.trim()) return null;

  const lower = text.toLowerCase();

  for (const [phrase, canonical] of TEXT_COUNTRY_PHRASES) {
    const pattern = new RegExp(
      `(?:^|[\\s,;|·•\\-–—]|based in |located in |from )${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[\\s,;|·•\\-–—.!?])`,
      "i"
    );
    if (pattern.test(lower)) {
      return canonical;
    }
  }

  const commaParts = text.split(/[,|·•]/).map((part) => part.trim());
  for (let i = commaParts.length - 1; i >= 0; i -= 1) {
    const match = normalizeCountryToken(commaParts[i]);
    if (match) return match;
  }

  return null;
}

function extractFromUnknownValue(value: unknown): string | null {
  if (value == null) return null;

  if (typeof value === "string") {
    return (
      normalizeCountryToken(value) ??
      extractCountryFromText(value)
    );
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractFromUnknownValue(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const priorityKeys = [
      "country",
      "countryCode",
      "country_code",
      "countryName",
      "nation",
      "city",
      "state",
      "region",
      "name",
      "localizedName",
      "address",
      "street",
      "text",
      "label",
      "description",
    ];

    for (const key of priorityKeys) {
      if (key in record) {
        const found = extractFromUnknownValue(record[key]);
        if (found) return found;
      }
    }

    for (const nested of Object.values(record)) {
      const found = extractFromUnknownValue(nested);
      if (found) return found;
    }
  }

  return null;
}

export type ApifyCountrySource = {
  city?: unknown;
  country?: unknown;
  location?: unknown;
  address?: unknown;
  place?: unknown;
  intro?: string;
  about_me?: { text?: string };
  info?: string[];
  description?: string;
  pageAddress?: unknown;
  addressStreet?: unknown;
};

export function extractCountryFromApifyRecord(
  record: ApifyCountrySource
): string | null {
  const locationFields = [
    record.country,
    record.city,
    record.location,
    record.address,
    record.place,
    record.pageAddress,
    record.addressStreet,
  ];

  for (const field of locationFields) {
    const found = extractFromUnknownValue(field);
    if (found) return found;
  }

  for (const line of record.info ?? []) {
    const found = extractCountryFromText(line);
    if (found) return found;
  }

  const textSources = [
    record.intro,
    record.about_me?.text,
    record.description,
  ];

  for (const text of textSources) {
    const found = extractCountryFromText(text ?? "");
    if (found) return found;
  }

  return null;
}
