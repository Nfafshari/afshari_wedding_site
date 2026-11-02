"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useQueryParams } from "@/hooks/use-query-params";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";

// Long enough to skip most keystrokes, short enough to feel live.
const DEBOUNCE_MS = 250;

interface SearchFieldProps {
  /** Names the field and shows as its placeholder, e.g. "Find a guest". */
  label: string;
  /** The query-string key that holds the search. */
  param?: string;
  className?: string;
}

/** A search box kept in the URL, updated shortly after typing stops. Escape or × clears it. Match with lib/search.ts. */
export default function SearchField({ label, param = "q", className }: SearchFieldProps) {
  const { searchParams, setParams } = useQueryParams();
  const [value, setValue] = useState(searchParams.get(param) ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function commit(next: string) {
    setParams((params) => (next.trim() ? params.set(param, next) : params.delete(param)));
  }

  function change(next: string) {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next), DEBOUNCE_MS);
  }

  function clear() {
    clearTimeout(timer.current);
    setValue("");
    commit("");
  }

  return (
    <InputGroup className={cn("h-10 w-full sm:w-72", className)}>
      <InputGroupAddon>
        <Search aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(event) => change(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value) {
            event.preventDefault();
            clear();
          }
        }}
        className="[&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={clear}>
            <X aria-hidden />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
