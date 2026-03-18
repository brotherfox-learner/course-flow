import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({
  className,
  ...props
}) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md ring-1 ring-slate-300 bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "hover:ring-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300",
        "aria-invalid:ring-red-500 aria-invalid:focus:ring-red-500",
        className
      )}
      {...props} />
  );
}

export { Textarea }
