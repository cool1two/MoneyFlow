import type { BoardState } from "../models/board";

export const mockBoard: BoardState = {
  nodes: [
    { id: "salary", name: "Salary", position: { x: 60, y: 150 } },
    { id: "checking", name: "Checking", position: { x: 380, y: 130 } },
    { id: "rent", name: "Rent", position: { x: 740, y: 20 } },
    { id: "savings", name: "Savings", position: { x: 740, y: 230 } },
    { id: "groceries", name: "Groceries", position: { x: 740, y: 440 } },
    { id: "childcare", name: "Childcare", position: { x: 1060, y: 130 } },
  ],
  externalInflows: [
    { id: "paycheck", target: "salary", amount: 3000, frequency: "biweekly" },
  ],
  flows: [
    { id: "salary-checking", source: "salary", target: "checking", amount: 6500, frequency: "monthly" },
    { id: "checking-rent", source: "checking", target: "rent", amount: 1950, frequency: "monthly" },
    { id: "checking-savings", source: "checking", target: "savings", amount: 900, frequency: "monthly" },
    { id: "checking-groceries", source: "checking", target: "groceries", amount: 180, frequency: "weekly" },
    { id: "checking-childcare", source: "checking", target: "childcare", amount: 450, frequency: "biweekly" },
  ],
};
