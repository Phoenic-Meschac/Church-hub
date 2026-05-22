"use client";

import { HandCoins } from "lucide-react";
import { TransactionManager } from "@/components/treasury/TransactionManager";

export default function DimesPage() {
  return (
    <TransactionManager
      title="Dîmes"
      subtitle="Enregistrement et suivi des dîmes"
      icon={HandCoins}
      category="tithe"
    />
  );
}
