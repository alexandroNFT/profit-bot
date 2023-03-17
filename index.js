const { Client } = require('pg');
const Eris = require("eris");
const config = require("./config.json");

const bot = new Eris(config.botToken);

const dbClient = new Client({
  connectionString: config.connectionString,
});

let sentSignalIds = new Set(); // Keep track of sent signal IDs

async function getSignalsWithPriceRise() {
  const query = `
    SELECT s.id, s.highest_floor_price_after, s.floor_price, s.timestamp, c.name, c.image
    FROM ml_signals s
    JOIN collections c ON s.collection_id = c.id
    WHERE (s.highest_floor_price_after - s.floor_price) / s.floor_price > 0.4
    AND s.timestamp > NOW() - INTERVAL '10m';
  `;

  const result = await dbClient.query(query);
  return result.rows;
}

function formatTimeDifference(timestamp) {
  const now = new Date();
  const difference = now - new Date(timestamp);

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / (1000 * 60)) % 60);

  let formattedDifference = '';
  if (days > 0) {
    formattedDifference += `${days}d `;
  }
  if (hours > 0) {
    formattedDifference += `${hours}h `;
  }
  if (minutes > 0) {
    formattedDifference += `${minutes}m`;
  }

  return formattedDifference;
}

async function processSignals(channel) {
  const signals = await getSignalsWithPriceRise();

  if (signals.length > 0) {
    for (const signal of signals) {
      const { id, highest_floor_price_after, floor_price, timestamp, name, image } = signal;

      if (!sentSignalIds.has(id)) {
        const period = formatTimeDifference(timestamp);

        const embed = {
          description: ` ${name} Take-Profit target ✅\nFloor price when called: ${floor_price} \nHighest floor price after: ${highest_floor_price_after} \nProfit: 40+% 📈\nPeriod: ${period} ⏰`,
          thumbnail: { url: image },
        };

        channel.createMessage({ embed });
        sentSignalIds.add(id);
        console.log('signal send')
      }
    }
  }
}

bot.on('ready', async () => {
  console.log('Discord connected succesfully');

  await dbClient.connect(); // Move this line here

  const targetChannelId = '1085547490754953337';
  const targetChannel = bot.getChannel(targetChannelId);

  setInterval(() => {
    processSignals(targetChannel);
  }, 5 * 60 * 1000); // Check every 5 minutes
});

bot.on("error", (err) => {
  console.error(err);
});

bot.connect();