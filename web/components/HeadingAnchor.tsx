"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Link, Check } from "lucide-react";

const HOSTED_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rippling-os-2.vercel.app";

interface HeadingAnchorProps {
  id: string;
  children: React.ReactNode;
  variant: "h1" | "h2" | "h3";
}

export function HeadingAnchor({ id, children, variant }: HeadingAnchorProps) {
  const [copied, setCopied] = useState(false);
  const pathname = usePathname();

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${HOSTED_URL}${pathname}#${id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Tag = variant;
  const baseClasses = "scroll-mt-20 group";
  const h2Classes = variant === "h2" ? "border-b border-border pb-2" : "";

  return (
    <Tag id={id} className={`${baseClasses} ${h2Classes}`}>
      {children}
      <button
        onClick={handleCopy}
        className="ml-2 opacity-0 group-hover:opacity-50 hover:opacity-100 text-muted-foreground inline-flex items-center"
        title="Copy link to section"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Link className="h-4 w-4" />
        )}
      </button>
    </Tag>
  );
}
