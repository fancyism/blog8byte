"use client";

/**
 * BlogSearch - Search input with debounce and URL sync.
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "~/components/ui/input-group";

export function BlogSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";
  const [value, setValue] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const updateSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (term) {
        params.set("search", term);
        params.delete("page");
      } else {
        params.delete("search");
        params.delete("page");
      }

      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `/?${query}` : "/");
      });
    },
    [router, searchParams],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setValue(newValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateSearch(newValue.trim()), 350);
  };

  const handleClear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setValue("");
    updateSearch("");
  };

  useEffect(() => {
    const urlSearch = searchParams.get("search") ?? "";
    setValue(urlSearch);
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <InputGroup className="h-12 rounded-2xl bg-card/80">
        <InputGroupAddon align="inline-start">
          <InputGroupText>
            <Search />
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="ค้นหาบทความ..."
          className="h-12"
          aria-label="ค้นหาบทความ"
        />
        {value ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              onClick={handleClear}
              size="icon-xs"
              aria-label="ล้างคำค้นหา"
            >
              <X />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant={value ? "secondary" : "outline"}>
          {isPending ? "กำลังอัปเดต" : value ? "กรองผลลัพธ์แล้ว" : "พร้อมค้นหา"}
        </Badge>
        <p>พิมพ์เพื่อกรองจากชื่อบทความ และรีเซ็ตหน้ารายการอัตโนมัติ</p>
      </div>
    </div>
  );
}
