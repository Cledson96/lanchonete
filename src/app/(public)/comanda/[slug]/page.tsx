import { PublicComandaExperience } from "@/components/public-comanda-experience";

type ComandaPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export default async function ComandaPage({ params }: ComandaPageProps) {
  const { slug } = await params;

  return <PublicComandaExperience slug={slug} />;
}
