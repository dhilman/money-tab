import { ClientComponent } from "~/components/common/client-component";
import { Contributions } from "~/components/common/contribs/contribution";
import {
  type ContribsContext,
  ContribsProvider,
} from "~/components/common/contribs/provider";
import { WebAppMain } from "~/components/common/layout/webapp-layout";
import { useProfile } from "~/components/provider/auth/auth-provider";
import { useAddUsersToIndex } from "~/components/provider/users-provider";
import { webAppPage } from "~/components/provider/webapp-provider";
import { mockUsers } from "~/mocks/mocks";

export default webAppPage(Page);
function Page() {
  return (
    <WebAppMain className="flex flex-col items-center gap-12 py-12">
      <ClientComponent>
        <Content />
      </ClientComponent>
    </WebAppMain>
  );
}

function Content() {
  useAddUsersToIndex([mockUsers.alice, mockUsers.bob]);
  return (
    <>
      <CreatorWithUnassignedPaidFor />
      <CreatorWithUnassignedPaidBy />
      <JoinPaidByAndPaid />
      <Loading />
    </>
  );
}

function noop() {
  /* do nothing */
}

const CreatorWithUnassignedPaidFor = () => {
  const { user } = useProfile();
  return (
    <WrappedProvider
      title="Unassigned Paid For"
      value={{
        creatorId: user.id,
        isCreator: true,
        isParticipant: true,
        isVisible: true,
        amount: 4000,
        currencyCode: "USD",
        contribs: [
          {
            id: "1",
            userId: user.id,
            amountOwed: 1000,
            amountPaid: 4000,
            status: "CONFIRMED",
          },
          {
            id: "2",
            userId: mockUsers.bob.id,
            amountOwed: 1000,
            amountPaid: 0,
            status: "CONFIRMED",
          },
          {
            id: "3",
            userId: mockUsers.alice.id,
            amountOwed: 1000,
            amountPaid: 0,
            status: "PENDING",
          },
          {
            id: "4",
            userId: null,
            amountOwed: 1000,
            amountPaid: 0,
            status: "PENDING",
          },
        ],
      }}
    />
  );
};

const CreatorWithUnassignedPaidBy = () => {
  const { user } = useProfile();
  return (
    <WrappedProvider
      title="Unassigned Paid By"
      value={{
        creatorId: user.id,
        isCreator: true,
        isParticipant: true,
        isVisible: true,
        amount: 4000,
        currencyCode: "USD",
        contribs: [
          {
            id: "1",
            userId: user.id,
            amountOwed: 1000,
            amountPaid: 0,
            status: "CONFIRMED",
          },
          {
            id: "2",
            userId: mockUsers.bob.id,
            amountOwed: 1000,
            amountPaid: 0,
            status: "CONFIRMED",
          },
          {
            id: "3",
            userId: mockUsers.alice.id,
            amountOwed: 1000,
            amountPaid: 0,
            status: "NOT_DELIVERED",
          },
          {
            id: "4",
            userId: null,
            amountOwed: 1000,
            amountPaid: 4000,
            status: "PENDING",
          },
        ],
      }}
    />
  );
};

const JoinPaidByAndPaid = () => {
  return (
    <WrappedProvider
      title="Join Paid By And Paid"
      value={{
        joinContribId: "3",
        creatorId: mockUsers.alice.id,
        isCreator: false,
        isParticipant: false,
        isVisible: true,
        amount: 3000,
        currencyCode: "USD",
        contribs: [
          {
            id: "1",
            userId: mockUsers.alice.id,
            amountOwed: 1000,
            amountPaid: 0,
            status: "CONFIRMED",
          },
          {
            id: "2",
            userId: mockUsers.bob.id,
            amountOwed: 1000,
            amountPaid: 0,
            status: "CONFIRMED",
          },
          {
            id: "3",
            userId: null,
            amountOwed: 1000,
            amountPaid: 0,
            status: "PENDING",
          },
        ],
      }}
    />
  );
};

const Loading = () => {
  return (
    <WrappedProvider
      title="Loading"
      value={{
        id: "1",
        joinContribId: null,
        creatorId: mockUsers.alice.id,
        isCreator: false,
        isParticipant: false,
        isVisible: true,
        amount: 3000,
        currencyCode: "USD",
        contribs: [],
      }}
    />
  );
};

interface WrappedProviderProps {
  title: string;
  value: Partial<ContribsContext>;
}

const WrappedProvider = ({ title, value }: WrappedProviderProps) => {
  const { user } = useProfile();
  return (
    <ContribsProvider
      value={{
        id: "1",
        joinContribId: null,
        creatorId: user.id,
        isCreator: false,
        isParticipant: false,
        isVisible: true,
        amount: 3000,
        currencyCode: "USD",
        contribs: [],
        copyUrl: noop,
        isLoading: false,
        joinMutation: {
          isPending: false,
          mutate: noop,
        },
        ...value,
      }}
    >
      <div className="w-full">
        <div className="w-full text-center font-medium">{title}</div>
        <Contributions />
      </div>
    </ContribsProvider>
  );
};
