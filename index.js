const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Pegando as variáveis do Railway
const config = {
  token: process.env.TOKEN,
  client_id: process.env.CLIENT_ID
};

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder()
    .setName('verificar')
    .setDescription('Verifica uma key')
    .addStringOption(option =>
      option.setName('key')
        .setDescription('A key que você recebeu')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('gerar')
    .setDescription('Gera uma nova key válida por 12 horas')
];

const rest = new REST({ version: '10' }).setToken(config.token);

client.once('ready', async () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
  console.log("📦 Registrando comandos...");
  try {
    await rest.put(
      Routes.applicationCommands(config.client_id),
      { body: commands }
    );
    console.log("✅ Comandos registrados com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao registrar comandos:", error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const filePath = path.join(__dirname, 'keys.json');
  let keys = [];

  if (fs.existsSync(filePath)) {
    try {
      keys = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.error("❌ Erro ao ler keys.json:", err);
      return interaction.reply({ content: '⚠️ Erro interno ao acessar as keys.', ephemeral: true });
    }
  }

  if (interaction.commandName === 'verificar') {
    const inputKey = interaction.options.getString('key');
    const now = new Date();

    if (!inputKey || inputKey.length < 10) {
      return interaction.reply({ content: '❌ Key inválida ou muito curta.', ephemeral: true });
    }

    const keyObj = keys.find(k => k.key === inputKey);

    if (!keyObj) {
      return interaction.reply({ content: '❌ Key não encontrada.', ephemeral: true });
    }

    const createdAt = new Date(keyObj.created_at);
    const isExpired = (now - createdAt) > 12 * 60 * 60 * 1000;

    if (isExpired) {
      return interaction.reply({ content: '⏰ Key expirada.', ephemeral: true });
    }

    if (keyObj.used) {
      return interaction.reply({ content: '⚠️ Key já utilizada.', ephemeral: true });
    }

    keyObj.used = true;
    fs.writeFileSync(filePath, JSON.stringify(keys, null, 2));
    return interaction.reply({ content: '✅ Key válida! Acesso liberado.', ephemeral: true });
  }

  if (interaction.commandName === 'gerar') {
    const newKey = [...Array(20)].map(() => Math.random().toString(36)[2].toUpperCase()).join('');
    const now = new Date().toISOString();

    keys.push({
      key: newKey,
      created_at: now,
      used: false
    });

    fs.writeFileSync(filePath, JSON.stringify(keys, null, 2));

    return interaction.reply({ content: `🔑 Nova key gerada: \`${newKey}\`\n⏳ Válida por 12 horas.`, ephemeral: true });
  }
});

client.login(config.token);
