"use client";

import { useState } from "react";
import { CirclePlus, FileText, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import PlannerPage from "@/components/planner-page";
import SearchField from "@/components/search-field";
import SegmentedFilter from "@/components/segmented-filter";
import { Dialog } from "@/components/ui/dialog";
import { useQueryParams } from "@/hooks/use-query-params";
import { filterAndSortDocs, isDocSort } from "@/lib/documents";
import AddDocDialog from "./dialogs/add-doc-dialog";
import EditDocDialog from "./dialogs/edit-doc-dialog";
import DeleteDocDialog from "./dialogs/delete-doc-dialog";
import DocTile from "./components/doc-tile";
import { type ArchivedDoc } from "./data";

enum DialogType {
  None = 'none',
  Add =  'add',
  Edit = 'edit',
  Delete = 'delete'
}

interface DocArchiveProps {
  /** Every archived document, oldest first, with a freshly signed link. */
  docs: ArchivedDoc[];
}

export default function DocArchive({ docs }: DocArchiveProps) {
  const [activeDialog, setActiveDialog] = useState<DialogType>(DialogType.None);
  const [activeDocId, setActiveDocId] = useState<number | undefined>(undefined);

  // Looked up by id so a dialog always works on the current row after a revalidation.
  const activeDoc = docs.find((doc) => doc.id === activeDocId);

  // The query string is untrusted, so an unknown sort falls back to newest.
  const { searchParams, setParams } = useQueryParams();
  const rawSort = searchParams.get('sort');
  const sort = isDocSort(rawSort) ? rawSort : 'newest';
  const query = searchParams.get('q') ?? '';
  const shownDocs = filterAndSortDocs(docs, query, sort);
  // SearchField keeps its own text, so Clear search remounts it to empty it.
  const [searchKey, setSearchKey] = useState(0);

  function clearSearch() {
    setParams((params) => params.delete('q'));
    setSearchKey((key) => key + 1);
  }

  function closeDialog() {
    setActiveDialog(DialogType.None);
    setActiveDocId(undefined);
  }

  function openDialog(type: DialogType, doc: ArchivedDoc) {
    setActiveDocId(doc.id);
    setActiveDialog(type);
  }

  return (
    <Dialog
      // Form dialogs share this root. The delete confirmation brings its own (ConfirmDialog).
      open={activeDialog !== DialogType.None && activeDialog !== DialogType.Delete}
      onOpenChange={(open) => {
        // Radix calls this with the *next* open state. Only act on close.
        if (!open) {
          closeDialog();
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
          <>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <SegmentedFilter
                label="Sort documents"
                param="sort"
                defaultValue="newest"
                options={[
                  { value: 'newest', label: 'Newest' },
                  { value: 'az', label: 'A–Z' },
                ]}
              />
              <SearchField key={searchKey} label="Find a document" />
            </div>

            {shownDocs.length === 0 ? (
              <EmptyState icon={SearchX} title="No documents match" message="Try another name or company.">
                <Button variant="secondary" onClick={clearSearch}>Clear search</Button>
              </EmptyState>
            ) : (
              <ul aria-label="Documents" className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
                {shownDocs.map((doc) => (
                  <DocTile
                    key={doc.id}
                    doc={doc}
                    onEdit={(doc) => openDialog(DialogType.Edit, doc)}
                    onDelete={(doc) => openDialog(DialogType.Delete, doc)}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </PlannerPage>

      {activeDialog === DialogType.Add &&
        <AddDocDialog
          docs={docs}
          onSuccess={closeDialog}
        />
      }

      {activeDialog === DialogType.Edit &&
        <EditDocDialog
          docs={docs}
          docToUpdate={activeDoc}
          onSuccess={closeDialog}
        />
      }

      {activeDialog === DialogType.Delete &&
        <DeleteDocDialog
          docToDelete={activeDoc}
          onSuccess={closeDialog}
          onCancel={closeDialog}
        />
      }
    </Dialog>
  );
}
