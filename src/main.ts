import { conf } from '../config.js';
import { Scenes, Telegraf } from 'telegraf';
import db, { Ad, User }  from './helpers/database.js'
import { pause } from './helpers/utils.js'
import logger from './helpers/logger.js'
import { Logger } from 'log4js';

const bot = new Telegraf<Scenes.SceneContext>(conf.botToken);


(async (): Promise<void> => {
  const _logger: Logger = logger.get('Main')
  await pause(1000);

  let users = await db.getUsers()
  let usersIds = users ? Object.keys(users) : []

  bot.on('text', async (ctx) => {
    const { from } = ctx.update.message;
    await db.setUserListner(from as unknown as User)

    ctx.reply('Я добавил тебя, жди свежих вакансий')

    users = await db.getUsers()
    usersIds = users ? Object.keys(users) : []
    console.log(usersIds);
    _logger.info('add user')
  })

  function notifyUser(data: Ad): void {
    const text = `Появилась новая вакансия ${data.title}, 
    ссылка ${data.url}`;

    for(const id of usersIds) {
      bot.telegram.sendMessage(id, text)
    }
  }

  db.updateAds(notifyUser)

  bot.launch();
})()

 
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
