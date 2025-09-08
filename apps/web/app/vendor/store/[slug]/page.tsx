import CompletePage from "@/components/vendor-store/CompletePage";

// export const runtime = 'edge';

// export default async function Page({ params }: { params: { slug: string } }) {
//   const { slug } =  params

//   return <CompletePage slug={slug} />
// }

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <CompletePage slug={slug} />
}