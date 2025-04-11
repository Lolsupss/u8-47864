const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const config = {
  token: process.env.TOKEN,
  client_id: process.env.CLIENT_ID
};

const KEYS_PATH = path.join(__dirname, 'keys.json');

function loadKeys() {
  if (!fs.existsSync(KEYS_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));
  } catch (e) {
    console.error('Erro ao carregar keys:', e);
    return [];
  }
}

function saveKeys(keys) {
  fs.writeFileSync(KEYS_PATH, JSON.stringify(keys, null, 2));
}

function verificarKey(key) {
  const keys = loadKeys();
  const now = new Date();
  const found = keys.find(k => k.key === key);

  if (!found) return { status: 'error', message: '❌ Key não encontrada.' };

  const createdAt = new Date(found.created_at);
  const expirou = (now - createdAt) > 12 * 60 * 60 * 1000;

  if (expirou) return { status: 'expired', message: '⏰ Key expirada.' };
  if (found.used) return { status: 'used', message: '⚠️ Key já utilizada.' };

  found.used = true;
  saveKeys(keys);
  return { status: 'valid', message: '✅ Key válida!' };
}

// === API HTTP ===
app.post('/verificar', (req, res) => {
  const { key } = req.body;
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ status: 'error', message: 'Chave ausente ou inválida.' });
  }

  const resultado = verificarKey(key);
  res.json(resultado);
});

app.listen(PORT, () => {
  console.log(`🌐 API rodando em http://localhost:${PORT}`);
});

// === BOT DISCORD ===
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder()
    .setName('verificar')
    .setDescription('Verifica uma key')
    .addStringOption(option =>
      option.setName('key').setDescription('A key que você recebeu').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('gerar')
    .setDescription('Gera uma nova key válida por 12 horas')
];

const rest = new REST({ version: '10' }).setToken(config.token);

client.once('ready', async () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
  try {
    await rest.put(Routes.applicationCommands(config.client_id), { body: commands });
    console.log("✅ Comandos registrados");
  } catch (err) {
    console.error("❌ Erro ao registrar comandos:", err);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const keys = loadKeys();

  if (interaction.commandName === 'verificar') {
    const inputKey = interaction.options.getString('key');
    const result = verificarKey(inputKey);
    return interaction.reply({ content: result.message, ephemeral: true });
  }

  if (interaction.commandName === 'gerar') {
    const novaKey = [...Array(20)].map(() => Math.random().toString(36)[2].toUpperCase()).join('');
    const agora = new Date().toISOString();

    keys.push({ key: novaKey, created_at: agora, used: false });
    saveKeys(keys);

    return interaction.reply({ content: `🔑 Key gerada: \`${novaKey}\`\n⏳ Válida por 12 horas.`, ephemeral: true });
  }
});

client.login(config.token);
