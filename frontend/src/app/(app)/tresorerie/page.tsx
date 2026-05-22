"use client";

import { Wallet } from "lucide-react";
import { TransactionManager } from "@/components/treasury/TransactionManager";

export default function TresoreriePage() {
  return (
    <TransactionManager
      title="Trésorerie"
      subtitle="Registre complet des entrées et sorties"
      icon={Wallet}
    />
  );
}
