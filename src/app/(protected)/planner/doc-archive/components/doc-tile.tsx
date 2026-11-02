"use client";

import { createElement } from "react";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import RowActionButton from "@/components/row-action-button";
import { formatDate } from "@/lib/utils";

import type { ArchivedDoc } from "../data";
import { resolveDocIcon } from "../dialogs/icon-picker";

interface DocTileProps {
  doc: ArchivedDoc;
  onEdit: (doc: ArchivedDoc) => void;
  onDelete: (doc: ArchivedDoc) => void;
}

/**
 * One document. The whole tile opens the file in a new tab through a link stretched
 * underneath; edit and delete sit above it so they don't open the file too.
 */
export default function DocTile ({ doc, onEdit, onDelete }: DocTileProps) {
  return (
    <li className="relative flex flex-col gap-2 rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm has-[a:active]:translate-y-px motion-reduce:transition-none">
      <a
        href={doc.link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${doc.name} (${doc.fileType}, opens in a new tab)`}
        className="absolute inset-0 z-10 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />

      <div className="flex items-center gap-2">
        {/* createElement, not a local <Icon>, so React keeps the component stable between renders. */}
        {createElement(resolveDocIcon(doc.icon), { className: "size-7 shrink-0 text-gold-ink", strokeWidth: 1.25, "aria-hidden": true })}
        <Badge variant="neutral">{doc.fileType}</Badge>
        <ExternalLink className="ml-auto size-4 shrink-0 text-burgundy-600" aria-hidden />
      </div>

      <div className="min-w-0">
        <p className="font-semibold break-words">{doc.name}</p>
        <p className="muted-caption break-words">{doc.companyName}</p>
      </div>

      <div className="mt-auto flex items-center gap-1">
        <p className="text-sm text-burgundy-600">Added {formatDate(doc.createdAt)}</p>
        <div className="relative z-20 ml-auto flex">
          <RowActionButton action="edit" aria-label={`Edit ${doc.name}`} onClick={() => onEdit(doc)} />
          <RowActionButton action="delete" aria-label={`Delete ${doc.name}`} onClick={() => onDelete(doc)} />
        </div>
      </div>
    </li>
  );
}
