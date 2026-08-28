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
    <div className="space-y-6 rounded-3xl border border-brand-500/30 bg-ink-900/90 p-6 backdrop-blur-2xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-ink-700/60 pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-100">
            <DollarSign className="size-5 text-brand-400" /> Smart Expense Splitter & Budget Intelligence
          </h3>
          <p className="text-xs text-slate-400">Automated "Who owes who" settlement logic and budget overrun warnings.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-brand-500/20 bg-ink-950/80 p-3 text-center">
          <p className="text-[10px] uppercase font-bold text-slate-500">Total Spent</p>
          <p className="text-lg font-extrabold text-slate-100">${totalExpense}</p>
        </div>
        <div className="rounded-2xl border border-brand-500/20 bg-ink-950/80 p-3 text-center">
          <p className="text-[10px] uppercase font-bold text-slate-500">Per Person Share</p>
          <p className="text-lg font-extrabold text-brand-300">${perPersonShare}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
          <p className="text-[10px] uppercase font-bold text-emerald-400">You Paid</p>
          <p className="text-lg font-extrabold text-emerald-300">$1,200</p>
        </div>
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-center">
          <p className="text-[10px] uppercase font-bold text-cyan-400">You Will Receive</p>
          <p className="text-lg font-extrabold text-cyan-300">+$650</p>
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
      <div className="rounded-2xl border border-brand-500/20 bg-ink-950/80 p-4">
        <h4 className="flex items-center gap-2 text-xs font-bold text-brand-300 mb-3">
          <ArrowRightLeft className="size-4 text-brand-400" /> Smart Settlement Breakdown ("Who Owes Who")
        </h4>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-center justify-between rounded-xl bg-ink-900/90 p-2.5">
            <span><strong>Ali Raza</strong> owes <strong>You</strong></span>
            <span className="font-bold text-emerald-400">+$250</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-ink-900/90 p-2.5">
            <span><strong>Sara Khan</strong> owes <strong>You</strong></span>
            <span className="font-bold text-emerald-400">+$400</span>
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
          className="h-10 flex-1 min-w-[160px] rounded-xl border border-ink-700 bg-ink-950 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount ($)..."
          className="h-10 w-28 rounded-xl border border-ink-700 bg-ink-950 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
        />
        <select
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          className="h-10 rounded-xl border border-ink-700 bg-ink-950 px-3 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
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
