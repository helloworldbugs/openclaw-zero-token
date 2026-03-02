import {
  collectTelegramStatusIssues,
  listTelegramAccountIds,
  resolveDefaultTelegramAccountId,
  resolveTelegramAccount,
  telegramOnboardingAdapter,
} from "../../dist/plugin-sdk/index.js";

function upsertTelegramAccount(cfg, accountId, patch) {
  const id = (accountId || "default").trim() || "default";
  const next = structuredClone(cfg ?? {});
  next.channels ??= {};
  next.channels.telegram ??= {};
  next.channels.telegram.accounts ??= {};
  next.channels.telegram.accounts[id] = {
    ...(next.channels.telegram.accounts[id] ?? {}),
    ...patch,
  };
  return next;
}

let runtimeRef;

const telegramPlugin = {
  id: "telegram",
  meta: {
    id: "telegram",
    label: "Telegram",
    selectionLabel: "Telegram (Bot API)",
    detailLabel: "Telegram Bot",
    docsPath: "/channels/telegram",
    docsLabel: "telegram",
    blurb: "simplest way to get started — register a bot with @BotFather and get going.",
    systemImage: "paperplane",
  },
  capabilities: {
    chatTypes: ["direct", "group", "channel", "thread"],
    polls: true,
    reactions: true,
    media: true,
    nativeCommands: true,
    blockStreaming: true,
    threads: true,
  },
  onboarding: telegramOnboardingAdapter,
  config: {
    listAccountIds: (cfg) => listTelegramAccountIds(cfg),
    resolveAccount: (cfg, accountId) => resolveTelegramAccount({ cfg, accountId }),
    defaultAccountId: (cfg) => resolveDefaultTelegramAccountId(cfg),
    setAccountEnabled: ({ cfg, accountId, enabled }) =>
      upsertTelegramAccount(cfg, accountId, { enabled }),
    isEnabled: (account) => account.enabled !== false,
    isConfigured: (account) => Boolean((account.token ?? "").trim()),
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async ({ to, text, cfg, accountId }) => {
      const result = await runtimeRef.channel.telegram.sendMessageTelegram(to, text, {
        cfg,
        accountId: accountId ?? undefined,
      });
      return {
        ok: true,
        channel: "telegram",
        to,
        messageId: String(result?.messageId ?? ""),
      };
    },
    sendPoll: async ({ to, question, options, cfg, accountId }) => {
      const result = await runtimeRef.channel.telegram.sendPollTelegram(to, {
        question,
        options,
        cfg,
        accountId: accountId ?? undefined,
      });
      return {
        ok: true,
        channel: "telegram",
        to,
        messageId: String(result?.messageId ?? ""),
      };
    },
  },
  status: {
    collectStatusIssues: (accounts) => collectTelegramStatusIssues(accounts),
    probeAccount: async ({ account, timeoutMs }) =>
      runtimeRef.channel.telegram.probeTelegram(account.token, timeoutMs),
  },
  gateway: {
    startAccount: async (ctx) => {
      await runtimeRef.channel.telegram.monitorTelegramProvider({
        accountId: ctx.accountId,
        config: ctx.cfg,
        runtime: ctx.runtime,
        abortSignal: ctx.abortSignal,
      });
    },
  },
};

export default {
  id: "telegram",
  register(api) {
    runtimeRef = api.runtime;
    api.registerChannel({ plugin: telegramPlugin });
  },
};
