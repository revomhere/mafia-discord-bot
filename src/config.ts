import jsonConfig from '@/../public/config.json';

const config = {
  nodeEnv: process.env.NODE_ENV || 'production',

  appId: process.env.APP_ID || '',
  privateToken: process.env.PRIVATE_TOKEN || '',

  guildId: process.env.GUILD_ID || '',

  logGuildId: process.env.LOG_GUILD_ID || '',
  logChannelId: process.env.LOG_CHANNEL_ID || '',

  ...jsonConfig
};

export default config;
