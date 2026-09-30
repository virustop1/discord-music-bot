const { Client, GatewayIntentBits, Collection, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { Player } = require('discord-player');
const config = require('./config.json');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent]
});

const player = new Player(client);
client.commands = new Collection();
let currentSong = null;

// حدث البوت جاهز
client.on('ready', async () => {
  console.log(`✅ البوت جاهز: ${client.user.tag}`);
  
  // دخول الروم الصوتية المحددة
  const guild = client.guilds.cache.first();
  if (guild) {
    const voiceChannel = guild.channels.cache.get(config.voiceChannelId);
    if (voiceChannel && voiceChannel.isVoiceBased()) {
      try {
        await voiceChannel.join();
        console.log(`✅ البوت دخل الروم الصوتية: ${voiceChannel.name}`);
      } catch (error) {
        console.error('❌ خطأ في الدخول للروم:', error);
      }
    }
  }
});

// استقبال الرسائل والبحث
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;

  // ✅ تحقق من أن المستخدم في نفس الروم الصوتية
  if (!message.member.voice.channel) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setDescription('❌ يجب أن تكون في نفس الروم الصوتية لاستخدام البوت')
      .setFooter({ text: config.embedFooter });
    return message.reply({ embeds: [errorEmbed] });
  }

  // ✅ تحقق من أن الروم الصوتية هي الروم المحددة
  if (message.member.voice.channel.id !== config.voiceChannelId) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setDescription(`❌ البوت يعمل فقط في روم محددة. الرجاء الانتقال إلى الروم الصحيحة`)
      .setFooter({ text: config.embedFooter });
    return message.reply({ embeds: [errorEmbed] });
  }

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  try {
    if (command === 'play' || command === 'p') {
      const query = args.join(' ');
      if (!query) {
        return message.reply('❌ اكتب اسم الأغنية');
      }

      await message.deferReply();

      try {
        const searchResult = await player.search(query, {
          requestedBy: message.author
        });

        if (searchResult.tracks.length === 0) {
          return message.editReply('❌ ما لقيت الأغنية');
        }

        const track = searchResult.tracks[0];
        const queue = player.nodes.create(message.guild, {
          metadata: {
            channel: message.channel
          }
        });

        if (!queue.connection) {
          queue.connect(message.member.voice.channel);
        }

        currentSong = {
          title: track.title,
          author: track.author,
          duration: track.duration,
          thumbnail: track.thumbnail,
          url: track.url
        };

        await queue.addTrack(track);
        if (!queue.isPlaying()) await queue.node.play();

        // عرض الأغنية بالتصميم المطلوب
        const embed = createMusicEmbed(track, searchResult.tracks.slice(1, config.searchResults + 1));
        await message.editReply({ embeds: [embed] });

        // عرض اقتراحات البحث
        showSearchSuggestions(message, searchResult.tracks.slice(1, config.searchResults + 1));

      } catch (error) {
        console.error('❌ خطأ:', error);
        message.editReply('❌ حصل خطأ في التشغيل');
      }
    }

    if (command === 'volume' || command === 'vol') {
      const volume = parseInt(args[0]);
      if (isNaN(volume) || volume < 0 || volume > config.maxVolume) {
        return message.reply(`❌ الصوت يجب أن يكون من 0 إلى ${config.maxVolume}%`);
      }
      
      const queue = player.nodes.get(message.guild);
      if (queue) {
        queue.node.setVolume(volume);
        const volumeEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription(`🔊 مستوى الصوت: ${volume}%`)
          .setFooter({ text: config.embedFooter });
        message.reply({ embeds: [volumeEmbed] });
      }
    }

    if (command === 'stop') {
      const queue = player.nodes.get(message.guild);
      if (queue) {
        queue.delete();
        const stopEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription('⏹️ تم إيقاف التشغيل')
          .setFooter({ text: config.embedFooter });
        message.reply({ embeds: [stopEmbed] });
      }
    }

    if (command === 'pause') {
      const queue = player.nodes.get(message.guild);
      if (queue) {
        queue.node.pause();
        const pauseEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription('⏸️ تم إيقاف التشغيل مؤقتاً')
          .setFooter({ text: config.embedFooter });
        message.reply({ embeds: [pauseEmbed] });
      }
    }

    if (command === 'resume') {
      const queue = player.nodes.get(message.guild);
      if (queue) {
        queue.node.resume();
        const resumeEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription('▶️ تم استئناف التشغيل')
          .setFooter({ text: config.embedFooter });
        message.reply({ embeds: [resumeEmbed] });
      }
    }

    if (command === 'skip') {
      const queue = player.nodes.get(message.guild);
      if (queue) {
        queue.node.skip();
        const skipEmbed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setDescription('⏭️ تم تخطي الأغنية')
          .setFooter({ text: config.embedFooter });
        message.reply({ embeds: [skipEmbed] });
      }
    }

    if (command === 'help') {
      const helpEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('📚 أوامر البوت')
        .addFields(
          { name: '!play <اسم>', value: 'تشغيل أغنية' },
          { name: '!pause', value: 'إيقاف مؤقت' },
          { name: '!resume', value: 'استئناف التشغيل' },
          { name: '!skip', value: 'تخطي الأغنية' },
          { name: '!stop', value: 'إيقاف التشغيل' },
          { name: '!volume <رقم>', value: `تعديل الصوت (0-${config.maxVolume}%)`},
          { name: '!help', value: 'عرض الأوامر' },
          { name: '⚠️ ملاحظة مهمة', value: `✅ يجب أن تكون في الروم الصوتية المحددة لاستخدام البوت` }
        )
        .setFooter({ text: config.embedFooter });
      message.reply({ embeds: [helpEmbed] });
    }
  } catch (error) {
    console.error('❌ خطأ:', error);
    message.reply('❌ حصل خطأ');
  }
});

// إعادة الاتصال تلقائياً
client.on('voiceStateUpdate', (oldState, newState) => {
  if (newState.member.id === client.user.id && !newState.channelId && config.autoReconnect) {
    const guild = newState.guild;
    const voiceChannel = guild.channels.cache.get(config.voiceChannelId);
    if (voiceChannel) {
      voiceChannel.join().catch(console.error);
    }
  }
});

// دالة لإنشاء Embed الأغنية
function createMusicEmbed(track, suggestions) {
  const durationMinutes = Math.floor(track.duration / 60000);
  const durationSeconds = Math.floor((track.duration % 60000) / 1000);
  const durationFormatted = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;

  let suggestionsText = '**اقتراحات البحث:**\n';
  suggestions.slice(0, config.searchResults).forEach((song, index) => {
    suggestionsText += `${index + 1}. [${song.title}](${song.url}) - ${song.author}\n`;
  });

  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle('🎵 تشغيل الآن')
    .setDescription(`**${track.title}**\nبواسطة: ${track.author}`)
    .setThumbnail(track.thumbnail)
    .addFields(
      { name: '⏱️ المدة', value: durationFormatted, inline: true },
      { name: '🔗 الرابط', value: `[اضغط هنا](${track.url})`, inline: true },
      { name: '\u200b', value: suggestionsText }
    )
    .setFooter({ text: config.embedFooter });

  return embed;
}

// دالة لعرض اقتراحات البحث
function showSearchSuggestions(message, suggestions) {
  if (suggestions.length === 0) return;

  const buttons = suggestions.slice(0, config.searchResults).map((song, index) => {
    return new ButtonBuilder()
      .setCustomId(`song_${index}`)
      .setLabel(song.title.substring(0, 80))
      .setStyle(ButtonStyle.Secondary);
  });

  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    const row = new ActionRowBuilder().addComponents(buttons.slice(i, i + 2));
    rows.push(row);
  }

  message.followUp({
    content: '🎧 اختر أغنية من الاقتراحات:',
    components: rows,
    ephemeral: true
  });
}

client.login(config.token);
