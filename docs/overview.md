# MoneyTab Overview

## MoneyTab Pages

### Home

- Balance Section: shows an amount and two selectors.
  - Type selector
    - Balance: the amount will display the total outstanding balance aggregated between the user and all contacts (includes expenses and subscriptions)
    - Subscriptions: the amount will display the total amount user is spending on subscriptions
  - Time range selector: allows to select time frame over which the balance is calculated (All time, last week, last month, last year)
- Action buttons section:
  - Add subscription (secondary)
  - Add expense (primary)
  - Share app (secondary)
- Links section: shows a list of links to other pages
  - Groups and Contacts
  - Blog / Articles
- Recent activity section: two tabs
  - Expenses: shows a list of recent expenses
  - Subscriptions: shows a list of recent subscriptions

### Add Expense

- Amount, Currency & Description input fields
- Optional form fields:
  - Date
  - Time
  - Attachments (images, files)
- Participants section: shows an action button to add participants or groups, once added two additional sections appear:
  - Payer selection (default to user)
  - Split input (default to equal split, amounts for each participant can be edited)
- Summary section: shows the result of the split (e.g. "You are owed $10.00")

### Expense Details

- Total expense amount
- Description
- Payer
- Participants: user list with their split amounts
  - An expense can be created with an "unassigned" participant, in this case an "invite" button will be shown for that participant
- Activity log section: shows a list of actions taken on the expense (creation, joining, leaving, editing, archiving)

### Add Subscription

- Amount, Currency & Name input fields
- Additional Options:
  - Trial period
  - Frequency (daily, weekly, monthly, yearly)
  - Start date
  - End date
- Participants section (same as in Add Expense)
- Summary section (e.g. "You pay 10$/month" or if others are involved "You are owed $10/month")

### Subscription Details

- Total amount & name
- Meta information: frequency, start date, end date
- Renewal reminder selector (e.g. none, 1 day before, 1 week before etc.)
- Participants: user list with their split amounts
- Spend per time period: amount spent per week, month and year

### Groups and Contacts

- Two tabs: Groups and Contacts
  - Groups tab: shows a list of groups (links) with number of members
  - Contacts tab: shows a list of contacts (links) with total outstanding balance with that contact
- Action button - "Add"

### Group Create

- Name input field
- Avatar color picker
- Members select (from contacts)

### Group Details

- Group avatar & name
- Members
- Expenses & Subscriptions

### Contact Details

- Contact avatar & name
- Total outstanding balances (for each currency if multiple)
  - Each balance has a button to "mark as settled"
- Recent activity: list of expenses and subscriptions with that contact

### Settings

- Default currency selector
- Language selector
- Hide balances toggle

## MoneyTab User Flows

### Creating an Expense or Subscription

1. User navigates to the "Add Expense" page
2. User adds optional details
3. User adds participants

- When user doesn't have any contacts (e.g. newly registered), they can add placeholder "unassigned" participants, which they can later invite

4. (optional): change payer
5. (optional): manually edit split amounts
6. Clicks "Create" (assigned participants receive a notification)
7. Navigated to the "Expense Details" page
8. (optional): invites unassigned participants

### Joining an Expense or Subscription

1. User receives an invitation link from a friend
2. User clicks the link
3. (The app automatically creates an account for the user)
4. User seems the expense/subscription details, including their split amount
5. User clicks "Confirm" (expense creator is notified and bilateral contact is created)

## MoneyTab TMA

MoneyTab is a Telegram Mini App (TMA). This means it is tightly integrated with Telegram and majority of the users will discover & access it through the Telegram app. Behind the scenes it is a web app that is hosted on a server and accessed through a webview in the Telegram app. Being a TMA allows MoneyTab to automatically authenticate users whenever they open the app through a link and send notifications through Telegram. Ease of access is particularly important for shared finance apps, as a lot of the functionality is around sharing expenses with friends and groups that users are interacting with on Telegram.
