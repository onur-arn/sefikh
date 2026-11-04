"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";

const CODES = [
  ["🇫🇷", "+33"], ["🇧🇪", "+32"], ["🇨🇭", "+41"], ["🇲🇨", "+377"], ["🇮🇹", "+39"], ["🇪🇸", "+34"], ["🇵🇹", "+351"], ["🇬🇧", "+44"],
  ["🇩🇪", "+49"], ["🇳🇱", "+31"], ["🇱🇺", "+352"], ["🇦🇪", "+971"], ["🇲🇦", "+212"], ["🇺🇸", "+1"], ["🇸🇬", "+65"], ["🇯🇵", "+81"],
];

/** Téléphone avec indicatif pays ; soumet une valeur unique « +33 6 12 34 56 78 ». */
export function PhoneInput({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  const tr = useT();
  const match = defaultValue?.match(/^(\+\d{1,4})\s?(.*)$/);
  const [code, setCode] = useState(match?.[1] ?? "+33");
  const [num, setNum] = useState(match?.[2] ?? "");
  return (
    <div className="flex gap-2">
      <select value={code} onChange={(e) => setCode(e.target.value)} className="field w-28 shrink-0" aria-label={tr("Country code")}>
        {CODES.map(([flag, c]) => (
          <option key={c} value={c}>
            {flag} {c}
          </option>
        ))}
      </select>
      <input value={num} onChange={(e) => setNum(e.target.value.replace(/[^\d\s.-]/g, ""))} inputMode="tel" autoComplete="tel-national" className="field" placeholder="6 12 34 56 78" aria-label={tr("Phone number")} />
      <input type="hidden" name={name} value={num.trim() ? `${code} ${num.trim()}` : ""} />
    </div>
  );
}
