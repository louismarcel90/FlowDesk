import InitiativeDetailClient from "./initiativeDetailClient";

type PageProps = {
  params: Promise<{ id: string }>; 
};

export default async function InitiativeDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) return null;
  return <InitiativeDetailClient id={id} />;
}