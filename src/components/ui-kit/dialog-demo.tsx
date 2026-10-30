"use client";

import { useState } from "react";

import ConfirmDialog from "@/components/confirm-dialog";
import FormDialog from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/** A pretend save, so the kit can show the loading state without a server action. */
const fakeSave = () => new Promise((resolve) => setTimeout(resolve, 1000));

/** Live samples of FormDialog and ConfirmDialog for the kit page. Nothing here is saved. */
export default function DialogDemo() {
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("Flowers");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function add() {
    if (name.trim() === "") {
      setNameError("Category name cannot be empty.");
      return;
    }
    setIsAdding(true);
    await fakeSave();
    setIsAdding(false);
    setAddOpen(false);
    setName("");
  }

  async function remove() {
    setIsDeleting(true);
    await fakeSave();
    setIsDeleting(false);
    setConfirmOpen(false);
    setEditOpen(false);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); setNameError(""); }}>
        <DialogTrigger asChild>
          <Button>Open a form dialog</Button>
        </DialogTrigger>
        <FormDialog
          title="Add Category"
          description="Submit it empty to see a field error."
          isLoading={isAdding}
          onSubmit={add}
        >
          <Field>
            <FieldLabel htmlFor="demo-category-name">Category Name</FieldLabel>
            <Input
              id="demo-category-name"
              placeholder="Venue & catering"
              value={name}
              aria-invalid={Boolean(nameError)}
              onChange={(e) => { setName(e.target.value); setNameError(""); }}
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </Field>
        </FormDialog>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Open an edit dialog</Button>
        </DialogTrigger>
        <FormDialog
          title="Edit Flowers"
          submitLabel="Save changes"
          isLoading={false}
          onSubmit={() => setEditOpen(false)}
        >
          <Field>
            <FieldLabel htmlFor="demo-edit-name">Name</FieldLabel>
            <Input id="demo-edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </Field>
          <Button type="button" variant="ghost-destructive" className="w-full" onClick={() => setConfirmOpen(true)}>
            Delete Flowers
          </Button>
        </FormDialog>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Delete Flowers?"
          description="You can't undo this."
          isLoading={isDeleting}
          onConfirm={remove}
        />
      </Dialog>
    </div>
  );
}
