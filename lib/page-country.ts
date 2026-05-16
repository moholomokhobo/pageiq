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

/** South African provinces / regions → country */
const REGION_TO_COUNTRY: Record<string, string> = {
  gauteng: "South Africa",
  "western cape": "South Africa",
  "eastern cape": "South Africa",
  "kwazulu-natal": "South Africa",
  "kwa zulu natal": "South Africa",
  "free state": "South Africa",
  limpopo: "South Africa",
  mpumalanga: "South Africa",
  "north west": "South Africa",
  "northern cape": "South Africa",
};

/** Cities → country (longest names should be matched via segment scan) */
const CITY_TO_COUNTRY: Record<string, string> = {
  // South Africa
  "richards bay": "South Africa",
  johannesburg: "South Africa",
  "cape town": "South Africa",
  durban: "South Africa",
  pretoria: "South Africa",
  "port elizabeth": "South Africa",
  gqeberha: "South Africa",
  soweto: "South Africa",
  bloemfontein: "South Africa",
  sandton: "South Africa",
  centurion: "South Africa",
  pietermaritzburg: "South Africa",
  polokwane: "South Africa",
  "east london": "South Africa",
  // USA
  "new york": "USA",
  "new york city": "USA",
  "los angeles": "USA",
  chicago: "USA",
  houston: "USA",
  phoenix: "USA",
  philadelphia: "USA",
  "san antonio": "USA",
  "san diego": "USA",
  dallas: "USA",
  "san jose": "USA",
  austin: "USA",
  jacksonville: "USA",
  miami: "USA",
  atlanta: "USA",
  boston: "USA",
  seattle: "USA",
  denver: "USA",
  "san francisco": "USA",
  detroit: "USA",
  "las vegas": "USA",
  washington: "USA",
  "washington dc": "USA",
  // UK
  london: "UK",
  manchester: "UK",
  birmingham: "UK",
  leeds: "UK",
  glasgow: "UK",
  liverpool: "UK",
  edinburgh: "UK",
  bristol: "UK",
  // Australia
  sydney: "Australia",
  melbourne: "Australia",
  brisbane: "Australia",
  perth: "Australia",
  adelaide: "Australia",
  // Canada
  toronto: "Canada",
  vancouver: "Canada",
  montreal: "Canada",
  calgary: "Canada",
  ottawa: "Canada",
  // Nigeria / Kenya / Ghana
  lagos: "Nigeria",
  abuja: "Nigeria",
  nairobi: "Kenya",
  accra: "Ghana",
  // UAE / India
  dubai: "UAE",
  "abu dhabi": "UAE",
  mumbai: "India",
  delhi: "India",
  bangalore: "India",
  bengaluru: "India",
  hyderabad: "India",
  chennai: "India",
  kolkata: "India",
  // Europe
  paris: "France",
  berlin: "Germany",
  madrid: "Spain",
  rome: "Italy",
  amsterdam: "Netherlands",
  dublin: "Ireland",
  // Latin America
  "sao paulo": "Brazil",
  "são paulo": "Brazil",
  "rio de janeiro": "Brazil",
  "mexico city": "Mexico",
  "buenos aires": "Argentina",
};

const TEXT_COUNTRY_PHRASES = Object.entries(COUNTRY_ALIASES).sort(
  (a, b) => b[0].length - a[0].length
);

const CITY_PHRASES = Object.entries(CITY_TO_COUNTRY).sort(
  (a, b) => b[0].length - a[0].length
);

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
  if (REGION_TO_COUNTRY[lower]) return REGION_TO_COUNTRY[lower];

  for (const [phrase, canonical] of TEXT_COUNTRY_PHRASES) {
    if (lower === phrase) return canonical;
  }

  if (/^[A-Za-z][A-Za-z\s.'-]{1,48}$/.test(trimmed) && !/\d/.test(trimmed)) {
    return titleCaseCountry(trimmed);
  }

  return null;
}

export function lookupCityToCountry(city: string): string | null {
  const lower = city.trim().toLowerCase().replace(/\s+/g, " ");
  if (!lower) return null;
  if (CITY_TO_COUNTRY[lower]) return CITY_TO_COUNTRY[lower];
  for (const [name, country] of CITY_PHRASES) {
    if (lower === name || lower.includes(name)) return country;
  }
  return null;
}

function resolveLocationSegment(segment: string): string | null {
  const trimmed = segment.trim();
  if (!trimmed) return null;

  const fromCity = lookupCityToCountry(trimmed);
  if (fromCity) return fromCity;

  const fromCountry =
    normalizeCountryToken(trimmed) ?? extractCountryFromText(trimmed);
  if (fromCountry) return fromCountry;

  const parts = trimmed.split(/[,|·•]/).map((p) => p.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const part = parts[i];
    const cityHit = lookupCityToCountry(part);
    if (cityHit) return cityHit;
    const regionHit = REGION_TO_COUNTRY[part.toLowerCase()];
    if (regionHit) return regionHit;
    const countryHit =
      normalizeCountryToken(part) ?? extractCountryFromText(part);
    if (countryHit) return countryHit;
  }

  return null;
}

/** "Lives in Cape Town" / "From Johannesburg" on personal profiles */
export function extractFromLivesInOrFrom(text: string): string | null {
  if (!text?.trim()) return null;

  const patterns = [
    /\blives in\s+([^·\n|]+?)(?:\s*[·|]|$)/gi,
    /\blived in\s+([^·\n|]+?)(?:\s*[·|]|$)/gi,
    /\bfrom\s+([^·\n|]+?)(?:\s*[·|]|$)/gi,
    /\bbased in\s+([^·\n|]+?)(?:\s*[·|]|$)/gi,
    /\blocated in\s+([^·\n|]+?)(?:\s*[·|]|$)/gi,
  ];

  for (const pattern of patterns) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const found = resolveLocationSegment(match[1]);
      if (found) return found;
    }
  }

  return null;
}

export function extractCountryFromText(text: string): string | null {
  if (!text?.trim()) return null;

  const fromProfile = extractFromLivesInOrFrom(text);
  if (fromProfile) return fromProfile;

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

  for (const [city, country] of CITY_PHRASES) {
    if (lower.includes(city)) return country;
  }

  const commaParts = text.split(/[,|·•]/).map((part) => part.trim());
  for (let i = commaParts.length - 1; i >= 0; i -= 1) {
    const match =
      lookupCityToCountry(commaParts[i]) ??
      normalizeCountryToken(commaParts[i]);
    if (match) return match;
  }

  return null;
}

function extractFromUnknownValue(value: unknown): string | null {
  if (value == null) return null;

  if (typeof value === "string") {
    return (
      lookupCityToCountry(value) ??
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
      "currentCity",
      "homeTown",
      "hometown",
      "home_town",
      "current_city",
      "city",
      "state",
      "region",
      "location",
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
  homeTown?: unknown;
  hometown?: unknown;
  currentCity?: unknown;
  current_city?: unknown;
  home_town?: unknown;
  state?: unknown;
  region?: unknown;
  intro?: string;
  about_me?: { text?: string };
  info?: string[];
  description?: string;
  pageAddress?: unknown;
  addressStreet?: unknown;
};

/** Keys we log from Apify page records for location debugging */
export const APIFY_LOCATION_FIELD_KEYS = [
  "city",
  "country",
  "location",
  "address",
  "place",
  "homeTown",
  "hometown",
  "currentCity",
  "current_city",
  "home_town",
  "state",
  "region",
  "pageAddress",
  "addressStreet",
  "intro",
  "description",
] as const;

export function pickApifyLocationFields(
  record: Record<string, unknown>
): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const key of APIFY_LOCATION_FIELD_KEYS) {
    if (record[key] !== undefined) picked[key] = record[key];
  }
  if (record.about_me !== undefined) picked.about_me = record.about_me;
  if (record.info !== undefined) picked.info = record.info;
  return picked;
}

export function extractCountryFromApifyRecord(
  record: ApifyCountrySource
): string | null {
  const locationFields = [
    record.country,
    record.location,
    record.address,
    record.place,
    record.pageAddress,
    record.addressStreet,
    record.currentCity,
    record.current_city,
    record.homeTown,
    record.hometown,
    record.home_town,
    record.city,
    record.state,
    record.region,
  ];

  for (const field of locationFields) {
    const found = extractFromUnknownValue(field);
    if (found) return found;
  }

  for (const line of record.info ?? []) {
    const fromProfile = extractFromLivesInOrFrom(line);
    if (fromProfile) return fromProfile;
    const found = extractCountryFromText(line);
    if (found) return found;
  }

  const textSources = [
    record.intro,
    record.about_me?.text,
    record.description,
  ];

  for (const text of textSources) {
    if (!text?.trim()) continue;
    const fromProfile = extractFromLivesInOrFrom(text);
    if (fromProfile) return fromProfile;
    const found = extractCountryFromText(text);
    if (found) return found;
  }

  return null;
}
