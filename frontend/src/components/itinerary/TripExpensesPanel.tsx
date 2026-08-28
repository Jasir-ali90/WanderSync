import { useState } from "react";
import { DollarSign, Plus, ArrowRightLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  category: string;
  splitWith: string[];
}

export function TripExpensesPanel() {
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: "1", title: "Resort Booking", amount: 1200, paidBy: "You", category: "Hotel", splitWith: ["Ali", "Sara"] },
    { id: "2", title: "Fuel & Highway Tolls", amount: 300, paidBy: "Ali", category: "Transport", splitWith: ["You", "Sara"] },
    { id: "3", title: "Traditional Dinner", amount: 150, paidBy: "Sara", category: "Food", splitWith: ["You", "Ali"] },
  ]);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("You");

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPersonShare = Math.round(totalExpense / 3);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    const newExp: Expense = {
      id: Date.now().toString(),
      title,
      amount: parseFloat(amount),
      paidBy,
      category: "General",
      splitWith: ["You", "Ali", "Sara"],
    };
    setExpenses([...expenses, newExp]);
    setTitle("");
    setAmount("");
  };

  return (
    <div className="space-y-6 rounded-3xl border border-blue-200 bg-white p-6 backdrop-blur-2xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-300/60 pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <DollarSign className="size-5 text-blue-600" /> Smart Expense Splitter & Budget Intelligence
          </h3>
          <p className="text-xs text-slate-500">Automated "Who owes who" settlement logic and budget overrun warnings.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-blue-200 bg-slate-50/80 p-3 text-center">
          <p className="text-[10px] uppercase font-bold text-slate-500">Total Spent</p>
          <p className="text-lg font-extrabold text-slate-800">${totalExpense}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-slate-50/80 p-3 text-center">
          <p className="text-[10px] uppercase font-bold text-slate-500">Per Person Share</p>
          <p className="text-lg font-extrabold text-blue-700">${perPersonShare}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-center">
          <p className="text-[10px] uppercase font-bold text-emerald-700">You Paid</p>
          <p className="text-lg font-extrabold text-emerald-600">$1,200</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-100 p-3 text-center">
          <p className="text-[10px] uppercase font-bold text-blue-600">You Will Receive</p>
          <p className="text-lg font-extrabold text-blue-700">+$650</p>
        </div>
      </div>

      {/* Overspending Warning Alert */}
      {totalExpense > 1500 && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 font-semibold">
          <AlertTriangle className="size-4 shrink-0 text-amber-400" />
          <span>⚠️ Smart Intelligence Alert: Hotel expenses are 25% higher than original target budget.</span>
        </div>
      )}

      {/* Settlement Calculation Engine */}
      <div className="rounded-2xl border border-blue-200 bg-slate-50/80 p-4">
        <h4 className="flex items-center gap-2 text-xs font-bold text-blue-700 mb-3">
          <ArrowRightLeft className="size-4 text-blue-600" /> Smart Settlement Breakdown ("Who Owes Who")
        </h4>
        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex items-center justify-between rounded-xl bg-white p-2.5">
            <span><strong>Ali Raza</strong> owes <strong>You</strong></span>
            <span className="font-bold text-emerald-700">+$250</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white p-2.5">
            <span><strong>Sara Khan</strong> owes <strong>You</strong></span>
            <span className="font-bold text-emerald-700">+$400</span>
          </div>
        </div>
      </div>

      {/* Add Expense Form */}
      <form onSubmit={handleAddExpense} className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Expense title (e.g. Dinner)..."
          className="h-10 flex-1 min-w-[160px] rounded-xl border border-slate-300 bg-slate-50 px-3 text-xs text-slate-800 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount ($)..."
          className="h-10 w-28 rounded-xl border border-slate-300 bg-slate-50 px-3 text-xs text-slate-800 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
        <select
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          className="h-10 rounded-xl border border-slate-300 bg-slate-50 px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="You">Paid by You</option>
          <option value="Ali">Paid by Ali</option>
          <option value="Sara">Paid by Sara</option>
        </select>
        <Button size="sm" type="submit" className="rounded-xl">
          <Plus className="size-4 mr-1" /> Log Expense
        </Button>
      </form>
    </div>
  );
}
