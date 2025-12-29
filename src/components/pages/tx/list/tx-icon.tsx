import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Equal,
  UnfoldVerticalIcon,
  type LucideProps,
} from "lucide-react";

export type Operation = "lend" | "borrow" | "split" | "settle";

interface Props extends LucideProps {
  operation: Operation;
}

export function TxIcon({ operation, ...rest }: Props) {
  switch (operation) {
    case "lend":
      return <ArrowDownToLine {...rest} />;
    case "borrow":
      return <ArrowUpFromLine {...rest} />;
    case "split":
      return <UnfoldVerticalIcon {...rest} />;
    case "settle":
      return <Equal {...rest} />;
  }
}
