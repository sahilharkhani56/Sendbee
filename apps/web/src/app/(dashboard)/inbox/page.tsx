"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ConversationList } from "@/components/inbox/conversation-list";
import { ChatThread } from "@/components/inbox/chat-thread";
import { ChatHeader } from "@/components/inbox/chat-header";
import { ReplyBox } from "@/components/inbox/reply-box";
import { ContactSidebar } from "@/components/inbox/contact-sidebar";
import { useConversationDetail } from "@/hooks/use-conversations";

export default function InboxPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const { data: conversation } = useConversationDetail(selectedId);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileView("chat");
  };

  const handleBack = () => {
    setMobileView("list");
    setSelectedId(null);
  };

  return (
    <div className="h-[calc(100vh-56px)] md:h-[calc(100vh-56px)] flex overflow-hidden -m-6 rounded-none">
      {/* Conversation List — Left Panel */}
      <div
        className={cn(
          "w-full md:w-[340px] lg:w-[360px] shrink-0 flex flex-col bg-white dark:bg-slate-800",
          mobileView === "chat" ? "hidden md:flex" : "flex"
        )}
      >
        <ConversationList selectedId={selectedId} onSelect={handleSelect} />
      </div>

      {/* Chat Area — Center Panel */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-800",
          mobileView === "list" ? "hidden md:flex" : "flex"
        )}
      >
        {selectedId && conversation ? (
          <>
            <ChatHeader
              contact={conversation.contact}
              status={conversation.status}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              sidebarOpen={sidebarOpen}
              onBack={handleBack}
            />
            <ChatThread conversationId={selectedId} />
            <ReplyBox
              conversationId={selectedId}
              contactName={conversation.contact.name}
            />
          </>
        ) : (
          <ChatThread conversationId={null} />
        )}
      </div>

      {/* Contact Sidebar — Right Panel */}
      {selectedId && sidebarOpen && (
        <div className="hidden lg:block w-[300px] shrink-0 bg-white dark:bg-slate-800">
          <ContactSidebar conversationId={selectedId} />
        </div>
      )}
    </div>
  );
}
