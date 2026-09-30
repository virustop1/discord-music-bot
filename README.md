# Discord Music Bot 🎵

بوت Discord لتشغيل الموسيقى من YouTube مع واجهة احترافية

## المميزات ✨

✅ تشغيل الأغاني من YouTube  
✅ البحث عن الأغاني مع اقتراحات  
✅ التحكم بالصوت حتى 150%  
✅ البوت يبقى في الروم 24/7  
✅ إعادة اتصال تلقائية  
✅ واجهة احترافية مع Embeds  
✅ التحقق من أن المستخدم في نفس الروم  

## الأوامر 📝

```
!play <اسم الأغنية>  - تشغيل أغنية
!pause               - إيقاف مؤقت
!resume              - استئناف التشغيل
!skip                - تخطي الأغنية
!stop                - إيقاف التشغيل
!volume <رقم>        - تعديل الصوت (0-150%)
!help                - عرض الأوامر
```

## الإعداد 🔧

### 1. التثبيت

```bash
npm install
```

### 2. إنشاء ملف `.env`

```
DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
```

### 3. تعديل `config.json`

```json
{
  "token": "YOUR_DISCORD_BOT_TOKEN_HERE",
  "voiceChannelId": "YOUR_VOICE_CHANNEL_ID_HERE",
  "prefix": "!",
  "maxVolume": 150,
  "embedFooter": "by virus"
}
```

### 4. تشغيل البوت

```bash
npm start
```

## المتطلبات 📦

- Node.js v16+
- Discord.js v14
- discord-player
- play-dl

## الملاحظات ⚠️

- البوت يرد فقط على من هو في نفس الروم الصوتية المحددة
- يجب أن يكون للبوت صلاحيات الدخول للروم الصوتية
- احرص على تفعيل جميع الـ Intents المطلوبة في Discord Developer Portal

---

**Made with ❤️ by virus**
