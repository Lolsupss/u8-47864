if (interaction.commandName === 'verificar') {
  const inputKey = interaction.options.getString('key');
  const now = new Date();

  // ✅ Verificação de key vazia ou muito curta
  if (!inputKey || inputKey.length < 8) {
    return interaction.reply({
      content: '❌ Você precisa fornecer uma key válida (mínimo 8 caracteres).',
      ephemeral: true
    });
  }

  const keyObj = keys.find(k => k.key === inputKey);

  if (!keyObj) {
    return interaction.reply({ content: '❌ Key inválida.', ephemeral: true });
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
