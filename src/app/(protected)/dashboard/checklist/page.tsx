import { prisma } from '@/lib/prisma';

import Checklist from "./client";

export async function getCategories () {
  const categories = prisma.taskCategory.findMany({
    include: { tasks: true },
    orderBy: { order: "asc" },
  });

  return categories;
}

export type CategoryWithTasks = Awaited<ReturnType<typeof getCategories>>[number]

export default async function ChecklistWrapper () {
  const categories = await getCategories();

  return (
    <Checklist categories={categories} />
  )
}