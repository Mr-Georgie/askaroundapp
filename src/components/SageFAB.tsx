'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { AskSageDialog } from '@/components/AskSageDialog';
import { usePathname } from 'next/navigation';

export default function SageFAB() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const pathname = usePathname();

  // Don't show the FAB on the Sage history page.
  if (pathname.startsWith('/sage')) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg z-40 animate-in fade-in-0 zoom-in-95 duration-500 bg-accent text-accent-foreground hover:bg-accent/90"
        size="icon"
      >
        <Bot className="h-7 w-7" />
        <span className="sr-only">Ask Sage</span>
      </Button>
      <AskSageDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        conversationId={null} // Always start a new conversation
        onConversationCreated={() => {}} // No action needed here for the FAB
      />
    </>
  );
}
