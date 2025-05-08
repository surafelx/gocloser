import AppLayout from "@/components/app-layout";

export default function TranscriptsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
