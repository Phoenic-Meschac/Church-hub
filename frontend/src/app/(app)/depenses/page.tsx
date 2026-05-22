"use client";

import { Receipt } from "lucide-react";
import { TransactionManager } from "@/components/treasury/TransactionManager";

export default function DepensesPage() {
  return (
    <TransactionManager
      title="Dépenses"
      subtitle="Suivi et validation des dépenses"
      icon={Receipt}
      category="expense"
    />
  );
}
