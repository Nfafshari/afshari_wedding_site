"use client";

import { useState } from "react";
import { CirclePlus, Gift } from "lucide-react";

import { Dialog } from "@/components/ui/dialog";
import RegistryRow from "./components/registry-row";
import AddItemDialog from "./dialogs/add-item-dialog";
import EditItemDialog from "./dialogs/edit-item-dialog";
import AddClaimDialog from "./dialogs/add-claim-dialog";
import RemoveClaimDialog from "./dialogs/remove-claim-dialog";

import type { RegistryClaim, RegistryItem } from "./page";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import PlannerPage from "@/components/planner-page";
import { Stat, StatRow } from "@/components/stat";
import { countFullyClaimedItems, getClaimedQuantity } from "@/lib/registry";

interface RegistryManagerProps {
  registryItems: RegistryItem[]
}

enum DialogType {
  None =        'none',
  AddItem =     'addItem',
  EditItem =    'editItem',
  AddClaim =    'addClaim',
  RemoveClaim = 'removeClaim'
}

export default function RegistryManager({ registryItems }: RegistryManagerProps) {
  /** States */
  const [activeDialog, setActiveDialog] = useState<DialogType>(DialogType.None);
  const [activeItem, setActiveItem] = useState<RegistryItem | undefined>(undefined);
  const [activeClaim, setActiveClaim] = useState<RegistryClaim | undefined>(undefined);

  // Summary stats. Like the budget page, the server hands over raw rows and the
  // totals are reduced here rather than aggregated in SQL.
  const totalItems = registryItems.length;
  const fullyClaimedItems = countFullyClaimedItems(registryItems);
  const totalGiftsClaimed = registryItems.reduce((sum, item) => sum + getClaimedQuantity(item), 0);

  // Close any open dialog. Each dialog owns its own form state, so unmounting it resets that state.
  function closeDialog () {
    setActiveDialog(DialogType.None);
    setActiveItem(undefined);
    setActiveClaim(undefined);
  }

  function onEditItem (item: RegistryItem) {
    setActiveItem(item);
    setActiveDialog(DialogType.EditItem);
  }

  function onAddClaim (item: RegistryItem) {
    setActiveItem(item);
    setActiveDialog(DialogType.AddClaim);
  }

  function onRemoveClaim (claim: RegistryClaim) {
    setActiveClaim(claim);
    setActiveDialog(DialogType.RemoveClaim);
  }

  return (
    <Dialog
      // Form dialogs share this root. Delete confirmations bring their own (ConfirmDialog).
      open={activeDialog !== DialogType.None && activeDialog !== DialogType.RemoveClaim}
      onOpenChange={(open) => {
        // Radix calls this with the *next* open state. Only act on close.
        if (!open) {
          closeDialog();
        }
      }}
    >
      <PlannerPage>
        <PageHeader
          title="Registry"
          actions={
            <Button onClick={() => setActiveDialog(DialogType.AddItem)}>
              <CirclePlus />
              Add item
            </Button>
          }
        />

        <StatRow className="grid-cols-3">
          <Stat value={totalItems} caption="Items" />
          <Stat value={fullyClaimedItems} caption="Fully Claimed" tone="success" />
          <Stat value={totalGiftsClaimed} caption="Gifts Claimed" />
        </StatRow>
        <hr className="my-5 bg-accent" />

        {/** items */}
        <div className="flex flex-col w-full">
          {registryItems.length === 0 ? (
            <EmptyState
              size="page"
              icon={Gift}
              title="Nothing on the registry yet"
              message="Add your first item to start tracking who is buying what."
            >
              <Button onClick={() => setActiveDialog(DialogType.AddItem)}>
                <CirclePlus />
                Add item
              </Button>
            </EmptyState>
          ) : (
            registryItems.map((item) => (
              <RegistryRow
                key={item.id}
                item={item}
                onEdit={onEditItem}
                onAddClaim={onAddClaim}
                onRemoveClaim={onRemoveClaim}
              />
            ))
          )}
        </div>
      </PlannerPage>

      {activeDialog === DialogType.AddItem &&
        <AddItemDialog
          items={registryItems}
          onSuccess={closeDialog}
        />
      }

      {activeDialog === DialogType.EditItem &&
        <EditItemDialog
          items={registryItems}
          itemToUpdate={activeItem}
          onSuccess={closeDialog}
        />
      }

      {activeDialog === DialogType.AddClaim &&
        <AddClaimDialog
          itemToClaim={activeItem}
          onSuccess={closeDialog}
        />
      }

      {activeDialog === DialogType.RemoveClaim &&
        <RemoveClaimDialog
          claimToRemove={activeClaim}
          onSuccess={closeDialog}
          onCancel={closeDialog}
        />
      }
    </Dialog>
  );
}
