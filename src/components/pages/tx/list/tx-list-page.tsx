import dayjs from "dayjs";
import Fuse from "fuse.js";
import { useMemo, useState } from "react";
import { Bento, BentoContent, BentoHeader } from "~/components/bento-box";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { TxDefault } from "~/components/pages/tx/list/tx-list-item";
import { TxListSearch } from "~/components/pages/tx/list/tx-list-search";
import { api, type RouterOutputs } from "~/utils/api";
import { toMapGrouped } from "~/utils/map";

interface Props {
  userId: string | null;
  groupId: string | null;
}

export const TxListPage = ({
  userId: startUserId,
  groupId: startGroupId,
}: Props) => {
  const { data, isLoading } = api.tx.list.useQuery({
    archived: false,
  });
  const [userId, setUserId] = useState<string | null>(startUserId);
  const [groupId, setGroupId] = useState<string | null>(startGroupId);
  const [query, setQuery] = useState("");
  const [numUsers, setNumUsers] = useState(0);

  const fuse = useMemo(() => {
    return new Fuse(data?.txs || [], {
      keys: ["description"],
      isCaseSensitive: false,
    });
  }, [data?.txs]);

  const txs = useMemo(() => {
    if (!data?.txs) return [];
    let filtered = data.txs;
    if (query) {
      filtered = fuse.search(query).map((r) => r.item);
    }
    if (numUsers > 0) {
      if (numUsers === 5) {
        filtered = filtered.filter((tx) => tx.contribs.length >= 5);
      } else {
        filtered = filtered.filter((tx) => tx.contribs.length === numUsers);
      }
    }
    if (userId) {
      filtered = filtered.filter((tx) =>
        tx.contribs.some((c) => c.userId === userId),
      );
    }
    if (groupId) {
      filtered = filtered.filter((tx) => tx.groupId === groupId);
    }
    return filtered;
  }, [data?.txs, query, numUsers, userId, groupId, fuse]);

  return (
    <WebAppMain className="flex flex-col gap-4">
      <TxListSearch
        query={query}
        setQuery={(v) => setQuery(v)}
        userId={userId}
        setUserId={(v) => setUserId(v)}
        numUsers={numUsers}
        setNumUsers={setNumUsers}
        groupId={groupId}
        setGroupId={(v) => setGroupId(v)}
      />
      {query ? (
        <Bento className="py-2">
          <BentoHeader>Search results</BentoHeader>
          <BentoContent>
            {txs.map((tx) => (
              <TxDefault key={tx.id} transaction={tx} />
            ))}
          </BentoContent>
        </Bento>
      ) : (
        <TxListStatefull txs={txs} isLoading={isLoading} />
      )}
    </WebAppMain>
  );
};

interface TxListStatefullProps {
  txs: Tx[];
  isLoading: boolean;
}

const TxListStatefull = ({ txs, isLoading }: TxListStatefullProps) => {
  if (isLoading) return <div className="w-full text-center">Loading...</div>;
  return <TxListGrouped txs={txs} />;
};

type Tx = RouterOutputs["tx"]["list"]["txs"][0];

interface TxListByMonthProps {
  txs: Tx[];
}

const TxListGrouped = ({ txs }: TxListByMonthProps) => {
  const grouped = useMemo(() => {
    const byMonth = toMapGrouped(txs, (tx) => {
      return dayjs(tx.createdAt).format("YYYY-MM");
    });

    // txs should already come sorted by createdAt
    // But just in case, we will sort the keys (months)

    const sorted = [...byMonth.entries()].sort(([a], [b]) => {
      return a < b ? 1 : -1;
    });
    return sorted.map(([month, txs]) => ({
      month,
      txs,
    }));
  }, [txs]);

  return (
    <div className="flex w-full flex-col gap-3">
      {grouped.map((v) => (
        <Bento key={v.month} className="py-2">
          <BentoHeader className="capitalize">
            {dayjs(v.month).format("MMMM YYYY")}
          </BentoHeader>
          <BentoContent className="">
            {v.txs.map((tx) => (
              <TxDefault key={tx.id} transaction={tx} />
            ))}
          </BentoContent>
        </Bento>
      ))}
    </div>
  );
};
