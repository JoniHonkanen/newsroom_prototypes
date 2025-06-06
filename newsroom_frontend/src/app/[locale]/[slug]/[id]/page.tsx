import { createApolloClient } from "@/lib/apolloClient";
import { GET_NEWS_ITEM } from "@/graphql/queries";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SingleNews } from "@/components/singleNews/SingleNews";
import { NewsItem } from "@/types/news";

const SLUGS = { fi: "uutinen", en: "news", sv: "nyhet" };

type Locale = keyof typeof SLUGS;

interface NewsPageParams {
  locale: Locale;
  slug: string;
  id: string;
}

export default async function NewsPage({ params }: { params: NewsPageParams }) {
  const { locale, slug, id: idWithSlug } = await params;

  if (SLUGS[locale] !== slug) return notFound();

  //extract id from idWithSlug
  const id = idWithSlug.split("-")[0];
  console.log("Extracted ID with slug:", idWithSlug);
  if (!id || isNaN(Number(id))) return notFound();
  console.log("Extracted ID:", id);

  const headerObj = await headers();
  const nextHeaders = Object.fromEntries(headerObj.entries());

  const apolloClient = createApolloClient(nextHeaders);

  //remember that singleNewsItem need to be defined in the GraphQL schema
  const { data } = await apolloClient.query<{ singleNewsItem: NewsItem }>({
    query: GET_NEWS_ITEM,
    variables: { id },
  });
  const news = data?.singleNewsItem;
  if (!news) return notFound();

  console.log("Fetched News Item:", news);

  // Välitä uutinen ja locale komponentille
  return <SingleNews news={news} locale={locale} />;
}
