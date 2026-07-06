export type Frequency = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";

const monthlyMultipliers: Record<Frequency, number> = {
  daily: 365 / 12,
  weekly: 52 / 12,
  biweekly: 26 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
};

export function toMonthlyAmount(amount: number, frequency: Frequency) {
  return amount * monthlyMultipliers[frequency];
}
