// src/commands/duyuru.js
import {
  SlashCommandBuilder, EmbedBuilder,
  ActionRowBuilder, StringSelectMenuBuilder,
  PermissionFlagsBits, MessageFlags
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('duyuru')
  .setDescription('Duyuru gönderir.')
  .addStringOption(o =>
    o.setName('mesaj').setDescription('Duyuru metni').setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  const mesaj = interaction.options.getString('mesaj', true);

  const menu = new StringSelectMenuBuilder()
    .setCustomId('duyuru_tipi')
    .setPlaceholder('Duyuru biçimini seç 👇')
    .addOptions(
      { label: '📦 Kutulu (Embed)', value: 'embed', description: 'Embed biçiminde gönder' },
      { label: '💬 Kutusuz (Metin)', value: 'plain', description: 'Sade metin olarak gönder' },
    );
  const row = new ActionRowBuilder().addComponents(menu);

  // Ephemeral için flags kullan (deprecated uyarısı olmaz)
  await interaction.reply({
    content: 'Duyuru biçimini seç 👇',
    components: [row],
    flags: MessageFlags.Ephemeral
  });

  let handled = false;

  const collector = interaction.channel.createMessageComponentCollector({
    filter: i => i.user.id === interaction.user.id && i.customId === 'duyuru_tipi',
    time: 20_000,
    max: 1, // ✅ tek sefer
  });

  collector.on('collect', async i => {
    handled = true;

    // ✅ 3sn kuralı: hemen acknowledge
    await i.deferUpdate().catch(() => {});

    // menüyü kaldır (ephemeral mesaj)
    await i.message?.edit({ components: [] }).catch(() => {});

    if (i.values[0] === 'embed') {
      // 1) önce EMBED (mention kapalı)
      const embed = new EmbedBuilder()
        .setTitle('📢 Duyuru')
        .setDescription(mesaj)
        .setColor(0x5865F2)
        .setTimestamp();

      await interaction.channel.send({
        embeds: [embed],
        allowedMentions: { parse: [] }
      });

      // 2) sonra tek gerçek ping
      await interaction.channel.send({
        content: '@everyone',
        allowedMentions: { parse: ['everyone'] }
      });

    } else {
      // DÜZ METİN: mevcut davranış — footer (<@id> · ||@everyone||) + tek ping
      const footerTag = `– Zenith Yetkili Ekibinden (<@${interaction.user.id}>) · ||@everyone||`;

      await interaction.channel.send({
        content: `📢 **Duyuru:** ${mesaj}\n\n${footerTag}`,
        allowedMentions: { parse: [] }
      });

      await interaction.channel.send({
        content: '@everyone',
        allowedMentions: { parse: ['everyone'] }
      });
    }

    // sonuç bildirimi (ephemeral, flags ile)
    await interaction.followUp({
      content: '✅ Duyuru gönderildi.',
      flags: MessageFlags.Ephemeral
    }).catch(() => {});
  });

  collector.on('end', (collected) => {
    if (!handled) {
      interaction.followUp({
        content: '⏳ Zaman aşımı: duyuru tipi seçilmedi.',
        flags: MessageFlags.Ephemeral
      }).catch(() => {});
    }
  });
}
