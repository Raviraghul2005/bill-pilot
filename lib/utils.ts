import dayjs from "dayjs";

export const formatCurrency = (value: number, currency = "USD"): string => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
};

export const formatSubscriptionDateTime = (value?: string): string => {
  if (!value) return "Not provided";
  const parsedDate = dayjs(value);
  return parsedDate.isValid()
    ? parsedDate.format("MM/DD/YYYY")
    : "Not provided";
};

export const formatStatusLabel = (value?: string): string => {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

// A decimal-pad keyboard shows the locale's separator, so a comma reaches us on
// plenty of devices. Returns NaN for anything that isn't a single clean number.
export const parsePriceInput = (value: string): number =>
  Number(value.trim().replace(",", "."));

// Every whitespace-separated token has to match somewhere in the record, so
// "adobe design" and "design adobe" both find the same subscription while
// "adobe spotify" finds nothing. An empty query matches everything.
export const searchSubscriptions = (
  subscriptions: Subscription[],
  query: string
): Subscription[] => {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return subscriptions;

  return subscriptions.filter((subscription) => {
    const haystack = [
      subscription.name,
      subscription.category,
      subscription.plan,
      subscription.billing,
      subscription.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return tokens.every((token) => haystack.includes(token));
  });
};
