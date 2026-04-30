"use client";

import { ContactsTable } from "@/components/contacts/contacts-table";

export default function ContactsPage() {
  return (
    <div className="space-y-1">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-foreground">Contacts</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your contacts, tags, and communication history
        </p>
      </div>
      <ContactsTable />
    </div>
  );
}
