export interface CreateExpenseRequest {
  expenseDate?: string;

  category: string;

  amount: number;

  note?: string;
}

export type UpdateExpenseRequest = Partial<CreateExpenseRequest>;

export interface ExpenseListQuery {
  from?: string;

  to?: string;
}
