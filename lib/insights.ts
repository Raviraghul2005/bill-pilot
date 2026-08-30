import dayjs, { type Dayjs } from "dayjs";

// A paused or cancelled plan still belongs in the history list, but it is not
// money leaving the account this month - keep it out of every spend figure.
export const isBillable = (status?: string): boolean => {
  const normalized = status?.trim().toLowerCase();
  return !normalized || normalized === "active";
};

const isYearly = (billing: string): boolean => billing.trim().toLowerCase() === "yearly";

/** What a subscription costs per month, with yearly plans spread across 12. */
export const getMonthlyCost = (subscription: Subscription): number =>
  isYearly(subscription.billing) ? subscription.price / 12 : subscription.price;

export const getMonthlySpend = (subscriptions: Subscription[]): number =>
  subscriptions
    .filter((subscription) => isBillable(subscription.status))
    .reduce((total, subscription) => total + getMonthlyCost(subscription), 0);

// A stored renewal date goes stale as time passes: a monthly plan last renewed
// in March is due again this month, not in the past. Roll it forward by its own
// billing interval until it lands on or after `from`.
export const getNextRenewal = (
  subscription: Subscription,
  from: Dayjs = dayjs()
): Dayjs | null => {
  if (!subscription.renewalDate) return null;

  let next = dayjs(subscription.renewalDate);
  if (!next.isValid()) return null;

  const unit = isYearly(subscription.billing) ? "year" : "month";
  const floor = from.startOf("day");

  // Bounded so a date decades in the past can never spin forever.
  for (let step = 0; next.isBefore(floor) && step < 600; step += 1) {
    next = next.add(1, unit);
  }

  return next;
};

export type UpcomingRenewal = {
  id: string;
  name: string;
  amount: number;
  date: Dayjs;
  label: string;
};

/** The next `limit` renewals due, soonest first. */
export const getUpcomingRenewals = (
  subscriptions: Subscription[],
  limit = 7,
  from: Dayjs = dayjs()
): UpcomingRenewal[] =>
  subscriptions
    .filter((subscription) => isBillable(subscription.status))
    .map((subscription) => {
      const date = getNextRenewal(subscription, from);
      if (!date) return null;

      return {
        id: subscription.id,
        name: subscription.name,
        amount: subscription.price,
        date,
        label: date.format("ddd"),
      };
    })
    .filter((renewal): renewal is UpcomingRenewal => renewal !== null)
    .sort((a, b) => a.date.valueOf() - b.date.valueOf())
    .slice(0, limit);

// There is no billing history to diff against yet, so "change" means: how much
// bigger is this month's commitment than it was before anything started this
// month. Adding a subscription moves it immediately, which is the point.
export const getMonthlySpendChange = (
  subscriptions: Subscription[],
  now: Dayjs = dayjs()
): number => {
  const startOfMonth = now.startOf("month");
  const current = getMonthlySpend(subscriptions);
  const previous = getMonthlySpend(
    subscriptions.filter(
      (subscription) =>
        !subscription.startDate || dayjs(subscription.startDate).isBefore(startOfMonth)
    )
  );

  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Rounds an axis maximum up to a readable 1/2/5 x 10^n step, so ticks read
// 0/25/50/75/100 rather than 0/19.4/38.7/58.1/77.5.
export const getNiceAxisMax = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 10;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return step * magnitude;
};

export const getAxisTicks = (max: number, count = 5): number[] =>
  Array.from({ length: count }, (_, index) => (max / (count - 1)) * (count - 1 - index));
