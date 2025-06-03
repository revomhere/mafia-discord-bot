const config = {
  appId: process.env.APP_ID || '',
  privateToken: process.env.PRIVATE_TOKEN || '',
  publicKey: process.env.PUBLIC_KEY || '',

  guildId: process.env.GUILD_ID || '',
  channelId: process.env.CHANNEL_ID || '',
  errorChannelId: process.env.ERROR_CHANNEL_ID || '',

  logGuildId: process.env.LOG_GUILD_ID || '',
  logChannelId: process.env.LOG_CHANNEL_ID || ''
};

export default config;
