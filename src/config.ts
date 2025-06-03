const config = {
  appId: process.env.APP_ID || '',
  privateToken: process.env.PRIVATE_TOKEN || '',
  publicKey: process.env.PUBLIC_KEY || '',
  logUserId: process.env.LOG_USER_ID || '',
  secondLogUserId: process.env.SECOND_LOG_USER_ID || '',

  guildId: process.env.GUILD_ID || '',
  channelId: process.env.CHANNEL_ID || '',
  errorChannelId: process.env.ERROR_CHANNEL_ID || ''
};

export default config;
