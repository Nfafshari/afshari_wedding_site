"use client";

import { useState } from "react";
import { CirclePlus, Gift } from "lucide-react";

import { AlertDialog } from "@/components/ui/alert-dialog";
import RegistryRow from "./components/registry-row";
import AddItemDialog from "./dialogs/add-item-dialog";
import EditItemDialog from "./dialogs/edit-item-dialog";
import AddClaimDialog from "./dialogs/add-claim-dialog";
import RemoveClaimDialog from "./dialogs/remove-claim-dialog";

import type { RegistryClaim, RegistryItem } from "./page";
import { Button } from "@/components/ui/button";
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
    <AlertDialog
      open={activeDialog !== DialogType.None}
      onOpenChange={(open) => {
        // Radix calls this with the *next* open state. Only act on close.
        if (!open) {
          closeDialog();
        }
      }}
    >
      <div className="w-full min-h-full bg-background font-sans text-burg px-6 pb-10 md:py-2 md:pb-10 md:px-12 lg:px-16">
        {/** title */}
        <div className="flex flex-col w-full md:flex-row">
          <h1 className="page-title w-full text-center translate-y-3 md:text-start">Registry Manager</h1>
        </div>
        <hr className="my-5 bg-accent"/>

        {/** summary stats */}
        <div className="flex flex-col w-full justify-center items-center">
          <div className="grid grid-cols-3 w-full">
            <div className="flex flex-col w-full justify-center items-center py-3 pl-2 md:pl-5">
              <p className="stat-number">{totalItems}</p>
              <p className="muted-caption pt-2">Items</p>
            </div>
            <div className="flex flex-col w-full justify-center items-center text-center py-3 pl-2 border-s-2 border-s-gold/50 md:pl-5">
              <p className="stat-number text-olivine">{fullyClaimedItems}</p>
              <p className="muted-caption pt-2">Fully Claimed</p>
            </div>
            <div className="flex flex-col w-full justify-center items-center text-center py-3 pl-2 border-s-2 border-s-gold/50 md:pl-5">
              <p className="stat-number">{totalGiftsClaimed}</p>
              <p className="muted-caption pt-2">Gifts Claimed</p>
            </div>
          </div>
          <hr className="mb-5 mt-2 w-9/10 bg-accent md:my-5"/>
        </div>
        

        {/** items */}
        <div className="flex flex-col w-full mt-6">
          {registryItems.length === 0 ? (
            <div className="flex flex-col w-full items-center justify-center gap-2 py-16 text-center text-burg/50">
              <Gift className="w-12 h-12 text-gold/50" strokeWidth={1} />
              <h2 className="page-subtitle text-lg md:text-2xl">Nothing on the registry yet</h2>
              <p className="text-sm text-muted">Add your first item to start tracking who is buying what.</p>
            </div>
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

          {/** Add item button at the end of the list */}
          <div className="flex w-full justify-start mt-2">
            <Button
              variant={'ghost'}
              className="text-burg/40 ml-5 hover:bg-burg hover:text-background"
              onClick={() => {
                setActiveDialog(DialogType.AddItem)
              }}
            >
              Add Item
              <CirclePlus/>
            </Button>
          </div>
        </div>
      </div>

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
        />
      }
    </AlertDialog>
  );
}
