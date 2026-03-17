import BotListPageClient from "./_components/bot-list-page-client";

export default async function BotsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <BotListPageClient workspaceId={id} />;
}
