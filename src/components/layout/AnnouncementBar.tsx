import Link from 'next/link';

const messages = [
  { id: 1, text: 'Open! Daily 6am–10pm', link: null },
  { id: 2, text: 'Save up to 70% off retail prices today at JD Power Warehouse!', link: null },
  { id: 3, text: 'Have overstock or returned items?', cta: 'Sell your items to us!', link: '/sell' },
  { id: 4, text: 'New inventory added weekly!', link: null },
];

function Separator() {
  return <span className="mx-6 text-[#f3c41b]/40">•</span>;
}

function MessageItem({ msg }: { msg: typeof messages[number] }) {
  if ('cta' in msg && msg.link) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap">
        {msg.text}{' '}
        <Link href={msg.link} className="font-semibold text-[#f3c41b] underline underline-offset-2 hover:text-[#f3c41b]/80 transition-colors">
          {msg.cta}
        </Link>
      </span>
    );
  }
  return <span className="whitespace-nowrap">{msg.text}</span>;
}

export default function AnnouncementBar() {
  // Duplicate messages for seamless loop
  const doubled = [...messages, ...messages];

  return (
    <div className="overflow-hidden bg-[#0f0f0f] border-b border-[#2e2e2e] py-2 text-sm text-[#f6f4ee]/90">
      <div className="marquee-track">
        {doubled.map((msg, i) => (
          <span key={`${msg.id}-${i}`} className="inline-flex items-center">
            <MessageItem msg={msg} />
            <Separator />
          </span>
        ))}
      </div>
    </div>
  );
}
