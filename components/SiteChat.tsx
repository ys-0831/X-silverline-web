'use client';

import { usePathname } from 'next/navigation';
import ChatWidget from './ChatWidget';
import AgentChat from './AgentChat';

/**
 * Mounted once in app/layout.tsx so the widget follows the visitor across every
 * page. The complaints page is excluded — a floating support assistant hovering
 * over a complaints form sends a muddled message.
 */
const HIDDEN_ON = ['/complaints'];

export default function SiteChat() {
  const pathname = usePathname();

  if (HIDDEN_ON.some((p) => pathname?.startsWith(p))) return null;

  return (
    <ChatWidget
      title="Silverline Support"
      subtitle="Answers come from an AI assistant"
      launcherLabel="Chat with us"
    >
      <AgentChat />
    </ChatWidget>
  );
}
