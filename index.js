require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder().setName('verificar').setDescription('Verifica uma key.').addStringOption(option =>
    option.setName('key').setDescription('Sua key de acesso').setRequired(true)),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registrando slash command...');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log('Slash command registrado com sucesso!');
  } catch (error) {
    console.error(error);
  }
})();

client.once('ready', () => {
  console.log(`Bot online como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === 'verificar') {
    const key = interaction.options.getString('key');
    // Aqui você pode validar a key com seu sistema
    await interaction.reply(`Key recebida: ${key}`);
  }
});

client.login(process.env.TOKEN);
