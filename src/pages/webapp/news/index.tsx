import Link from "next/link";
import { Bento } from "~/components/bento-box";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { webAppPage } from "~/components/provider/webapp-provider";
import { List } from "~/components/ui/list";
import {
  ListItem,
  ListItemBody,
  ListItemLeft,
} from "~/components/ui/list-item";

export default webAppPage(Page);
function Page() {
  return (
    <WebAppMain>
      <Bento>
        <List>
          <NewsListItem
            src="/poster/home.webp"
            slug="home-redesign"
            title="Homepage Redesign"
            description="Simple, intuitive, and more organized."
          />
          <NewsListItem
            src="/icons/icon-192x192.png"
            slug="welcome"
            title="Welcome to MoneyTab"
            description="Shared expenses - simplified."
          />
        </List>
      </Bento>
    </WebAppMain>
  );
}

interface NewsListItemProps {
  src: string;
  slug: string;
  title: string;
  description: string;
}

const NewsListItem = ({ src, slug, title, description }: NewsListItemProps) => {
  return (
    <ListItem as={Link} href={`/webapp/news/${slug}`}>
      <ListItemLeft>
        <img src={src} className="h-10 w-10 rounded-lg" alt="icon" />
      </ListItemLeft>
      <ListItemBody>
        <div>
          <div className="text-base font-medium">{title}</div>
          <div className="text-hint text-sm">{description}</div>
        </div>
      </ListItemBody>
    </ListItem>
  );
};
