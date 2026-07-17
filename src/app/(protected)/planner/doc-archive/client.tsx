"use client";

import { useState } from "react";
import { CirclePlus, ExternalLink, SquarePen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/ui/alert-dialog";
import AddDocDialog from "./dialogs/add-doc-dialog";
import EditDocDialog from "./dialogs/edit-doc-dialog";
import { EXAMPLE_DOCS_DATA, type ArchivedDoc } from "./data";

enum DialogType {
  None = 'none',
  Add =  'add',
  Edit = 'edit'
}

export default function DocArchive() {
  const [activeDialog, setActiveDialog] = useState<DialogType>(DialogType.None);
  const [docToEdit, setDocToEdit] = useState<ArchivedDoc | undefined>(undefined);

  return (
    <AlertDialog
      open={activeDialog !== DialogType.None}
      onOpenChange={(open) => {
        // Radix calls this with the *next* open state. Only act on close.
        if (!open) {
          setActiveDialog(DialogType.None);
        }
      }}
    >
      <div className="w-full min-h-full bg-background font-sans text-burg px-6 pb-6 md:py-2 md:px-12 lg:px-16">
        {/** title */}
        <div className="flex flex-col w-full md:flex-row">
          <h1 className="page-title w-full text-center translate-y-3 md:text-start">Documents Archive</h1>
        </div>
        <hr className="my-5 bg-accent"/>

        <div className="flex w-full md:px-10">
          <div className="grid grid-cols-2 gap-4 w-full h-full md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {EXAMPLE_DOCS_DATA.map((doc, idx) => {
              const Icon = doc.icon;

              return (
                <div key={`${doc.name}-${idx}`} className="relative flex flex-col w-full h-45 rounded-lg bg-muted/20 border border-border hover:shadow-sm has-[a:active]:translate-y-px has-[a:active]:-translate-x-px md:h-60 lg:h-80">
                  {/* Cover div with link underneath edit button so that the edit button does not trigger opening the pdf */}
                  <a
                    className="absolute inset-0 z-10"
                    href={doc.link}
                    target='_blank'
                    rel='noopener noreferrer'
                    aria-label={`Open ${doc.name} (PDF, opens in a new tab)`}
                  />

                  <ExternalLink className="absolute top-1 right-1 w-5 h-5 text-accent"/>

                  
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
                    className="absolute bottom-0.5 right-0.5 text-gold/40 hover:bg-olivine hover:text-background z-20 md:mt-auto"
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
            {/* Add document button at end of documents list */}
            <button
              className="flex w-full h-45 justify-center items-center border border-olivine/20 rounded-sm p-2 bg-olivine/5 cursor-pointer text-burg/50 hover:text-burg hover:shadow-sm active:translate-y-px active:-translate-x-px md:h-60 lg:h-80"
              onClick={() => {
                setActiveDialog(DialogType.Add)
              }}
            >
              <div className="p-2 flex flex-col items-center justify-center text-center hover:cursor-pointer">
                <CirclePlus className="w-10 h-10" />
                <h2 className="page-subtitle text-lg md:text-2xl">Add Document</h2>
              </div>
            </button>
          </div>
        </div>
      </div>

      {activeDialog === DialogType.Add &&
        <AddDocDialog />
      }

      {activeDialog === DialogType.Edit &&
        <EditDocDialog
          docs={EXAMPLE_DOCS_DATA}
          docToUpdate={docToEdit}
          onSuccess={() => setActiveDialog(DialogType.None)}
        />
      }
    </AlertDialog>
  );
}
