import { select } from "@inquirer/prompts";
import { Bot } from "grammy";
import { selectEnv } from "scripts/cli_utils";
import { inputConfirm } from "scripts/utils";

const { env } = await selectEnv();

const bot = new Bot(env.BOT_TOKEN);

const OPS = [
  {
    name: "Set webhook",
    value: "webhook" as const,
    func: async () => {
      const url = `${env.NEXT_PUBLIC_BASE_URL}/api/webhook/tg`;
      await inputConfirm(
        `Set webhook for ${env.NEXT_PUBLIC_BOT_NAME} to ${url}`
      );

      await bot.api.setWebhook(url, {
        secret_token: env.WEBHOOK_SECRET,
      });

      console.log("Webhook set");
    },
  },
  {
    name: "Set chat menu button",
    value: "chat_menu" as const,
    func: async () => {
      await bot.api.setChatMenuButton({
        menu_button: {
          type: "web_app",
          text: "Open App",
          web_app: {
            url: `${env.NEXT_PUBLIC_BASE_URL}/webapp`,
          },
        },
      });

      console.log("Chat menu button set");
    },
  },
  {
    name: "Set bot description",
    value: "description" as const,
    func: async () => {
      const descriptions = [
        {
          // Answer to the question: "What can this bot do?"
          text: "Helps keep track of subscriptions and shared expenses",
          language_code: "en" as const,
        },
        {
          // Отвечает на вопрос: "Что умеет этот бот?"
          text: "Помогает вести учет подписок и совместных расходов",
          language_code: "ru" as const,
        },
      ];
      for (const desc of descriptions) {
        await bot.api.setMyDescription(desc.text, {
          language_code: desc.language_code,
        });
      }
    },
  },
  {
    name: "Set commands",
    value: "commands" as const,
    func: async () => {
      await bot.api.setMyCommands(
        [{ command: "start", description: "My MoneyTab" }],
        { scope: { type: "all_private_chats" } }
      );
      await bot.api.setMyCommands(
        [{ command: "tab", description: "Group's MoneyTab" }],
        { scope: { type: "all_group_chats" } }
      );
    },
  },
];

console.log(
  `Running for ${env.NEXT_PUBLIC_BOT_NAME}, ID: ${env.NEXT_PUBLIC_BOT_ID}`
);

const opName = await select({
  message: "Select operation",
  choices: OPS.map((op) => ({ name: op.name, value: op.value })),
});

const op = OPS.find((o) => o.value === opName);
if (!op) {
  console.error("Invalid operation");
  process.exit(1);
}

await op.func();
console.log(`Completed ${op.name}`);
