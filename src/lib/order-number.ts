const ALLOWED_PAIRS = [
  "13",
  "14",
  "19",
  "22",
  "28",
  "31",
  "39",
  "41",
  "49",
  "62",
  "68",
  "72",
  "78",
  "82",
  "87",
  "91",
  "93",
  "11",
  "33",
  "44",
  "55",
  "66",
  "77",
  "88",
  "99",
];

const BANNED_PAIRS = ["18", "81", "79", "97", "42", "24", "36", "63"];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function formatDate(date: Date): string {
  return (
    String(date.getFullYear()) +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0")
  );
}

function hasBannedPair(digits: string): boolean {
  for (let i = 0; i < digits.length - 1; i++) {
    if (BANNED_PAIRS.includes(digits.slice(i, i + 2))) return true;
  }
  return false;
}

function randomDigit(): string {
  return String(Math.floor(Math.random() * 10));
}

function buildSuffix(dateLastDigit: string): string | null {
  const allowedEndings = ALLOWED_PAIRS.filter(
    (pair) => !BANNED_PAIRS.includes(`${dateLastDigit}${pair[0]}`),
  );

  for (let i = 0; i < 100; i++) {
    const ending = pick(allowedEndings);
    const suffix = `${randomDigit()}${randomDigit()}${ending}`;
    const bridge = `${dateLastDigit}${suffix[0]}`;

    if (!BANNED_PAIRS.includes(bridge) && !hasBannedPair(suffix)) {
      return suffix;
    }
  }

  return null;
}

export function generateOrderNumber(date = new Date()): string {
  const datePart = formatDate(date);
  const dateFirstDigit = datePart[0];
  const dateLastDigit = datePart[datePart.length - 1];

  const validPrefixes = ALLOWED_PAIRS.filter(
    (pair) => !BANNED_PAIRS.includes(`${pair[1]}${dateFirstDigit}`),
  );

  for (let i = 0; i < 100; i++) {
    const prefix = pick(validPrefixes);
    const suffix = buildSuffix(dateLastDigit);
    if (suffix) return `${prefix}${datePart}${suffix}`;
  }

  throw new Error("訂單編號產生失敗");
}
