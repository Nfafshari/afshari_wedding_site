"use client";

import { useState } from "react";
import { CirclePlus, ExternalLink, FileText, SquarePen } from "lucide-react";

import { Button } from "@/components/ui/button";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import PlannerPage from "@/components/planner-page";
import { Dialog } from "@/components/ui/dialog";
import AddDocDialog from "./dialogs/add-doc-dialog";
import EditDocDialog from "./dialogs/edit-doc-dialog";
import { resolveDocIcon } from "./dialogs/icon-picker";
import { type ArchivedDoc } from "./data";

enum DialogType {
  None = 'none',
  Add =  'add',
  Edit = 'edit'
}

interface DocArchiveProps {
  /** Every archived document, oldest first, with a freshly signed link. */
  docs: ArchivedDoc[];
}

export default function DocArchive({ docs }: DocArchiveProps) {
  const [activeDialog, setActiveDialog] = useState<DialogType>(DialogType.None);
  const [docToEdit, setDocToEdit] = useState<ArchivedDoc | undefined>(undefined);

  return (
    <Dialog
      open={activeDialog !== DialogType.None}
      onOpenChange={(open) => {
        // Radix calls this with the *next* open state. Only act on close.
        if (!open) {
          setActiveDialog(DialogType.None);
        }
      }}
    >
      <PlannerPage>
        <PageHeader
          title="Documents"
          actions={
            <Button onClick={() => setActiveDialog(DialogType.Add)}>
              <CirclePlus />
              Add document
            </Button>
          }
        />

        {docs.length === 0 ? (
          <EmptyState
            size="page"
            icon={FileText}
            title="No documents yet"
            message="Add contracts, receipts and other PDFs so they're all in one place."
          >
            <Button onClick={() => setActiveDialog(DialogType.Add)}>
              <CirclePlus />
              Add document
            </Button>
          </EmptyState>
        ) : (
          <div className="flex w-full md:px-10">
            <div className="grid grid-cols-2 gap-4 w-full h-full md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
              {docs.map((doc) => {
                const Icon = resolveDocIcon(doc.icon);

                return (
                  <div key={doc.id} className="relative flex flex-col w-full h-45 rounded-lg bg-muted/20 border border-border hover:shadow-sm has-[a:active]:translate-y-px has-[a:active]:-translate-x-px md:h-60 lg:h-80">
                    {/* Cover div with link underneath edit button so that the edit button does not trigger opening the pdf */}
                    <a
                      className="absolute inset-0 z-10"
                      href={doc.link}
                      target='_blank'
                      rel='noopener noreferrer'
                      aria-label={`Open ${doc.name} (PDF, opens in a new tab)`}
                    />

                    <ExternalLink className="absolute top-1 right-1 w-5 h-5 text-gold-ink"/>

                  
                    {/* Icon area */}
                    <div className="flex flex-col w-full h-3/5 md:h-2/3 mt-2 justify-center items-center ">
                      <Icon className="w-20 h-20 md:w-30 md:h-30 lg:w-40 lg:h-40" strokeWidth={0.5}/>
                      <p className="text-muted text-sm md:text-base mt-2">Created On: {doc.createdAt.toLocaleDateString()}</p>
                    </div>

                    {/* footer text area */}
                    <div className="flex flex-col w-full h-2/5 md:h-1/5 px-2 py-1 text-muted-foreground border-t border-border md:px-4 md:py-2">
                      <p className="font-bold text-burg md:text-xl lg:text-2xl">{doc.name}</p>
                      <p className="hidden md:flex">{doc.companyName}</p>
                    </div>

                    <Button
                      variant={'ghost'}
                      aria-label={`Edit ${doc.name}`}
                      size={'icon-sm'}
                      className="absolute bottom-0.5 right-0.5 z-20 md:mt-auto"
                      onClick={() => {
                        setDocToEdit(doc);
                        setActiveDialog(DialogType.Edit);
                      }}
                    >
                      <SquarePen />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </PlannerPage>

      {activeDialog === DialogType.Add &&
        <AddDocDialog
          docs={docs}
          onSuccess={() => setActiveDialog(DialogType.None)}
        />
      }

      {activeDialog === DialogType.Edit &&
        <EditDocDialog
          docs={docs}
          docToUpdate={docToEdit}
          onSuccess={() => setActiveDialog(DialogType.None)}
        />
      }
    </Dialog>
  );
}
