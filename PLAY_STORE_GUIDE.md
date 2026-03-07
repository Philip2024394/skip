# SkipTheApp — Google Play Store Release Guide

Everything in this guide must be done **manually** on your PC after the code changes are complete.

---

## Step 1 — Install Android Studio + JDK 17

1. Download **Android Studio**: https://developer.android.com/studio
2. During setup, ensure these SDK components are checked:
   - Android SDK (API 34)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
3. Download **JDK 17** (Temurin): https://adoptium.net/
4. After installing, set environment variables:

   Open **System Properties → Advanced → Environment Variables**, then add:
   ```
   ANDROID_HOME  =  C:\Users\Victus\AppData\Local\Android\Sdk
   JAVA_HOME     =  C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot
   ```
   Add to PATH:
   ```
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\platform-tools
   %JAVA_HOME%\bin
   ```
5. Restart your terminal and verify:
   ```
   java -version      # should show 17.x
   adb version        # should show Android Debug Bridge
   ```

---

## Step 2 — Build and open in Android Studio

Run these commands in the project folder:

```bash
npm run cap:build      # builds web app + syncs to android/
npm run cap:open       # opens Android Studio
```

---

## Step 3 — Set up launcher icons in Android Studio

The icon PNG files have been generated and placed in the mipmap folders.
For the best Play Store result, regenerate them using Android Studio's tool:

1. Right-click `android/app/src/main/res` → **New → Image Asset**
2. Set **Icon Type**: Launcher Icons (Adaptive and Legacy)
3. **Foreground Layer**: choose `public/icons/icon-512.png`
4. **Background Layer**: color `#000000`
5. Click **Next → Finish** — this overwrites the mipmap folders with properly sized adaptive icons

---

## Step 4 — Add Supabase redirect URL

In your **Supabase Dashboard → Authentication → URL Configuration**, add:
```
com.skiptheapp.app://
```
to the **Redirect URLs** list. This allows login/OAuth to work inside the Android app.

---

## Step 5 — Generate a signed release build

1. In Android Studio: **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle (.aab)** (required for Play Store)
3. Click **Create new keystore**:
   - Save as `skiptheapp-release.jks` — keep this file **very safe**, you need it for all future updates
   - Set a strong password
   - Fill in your name/organization details
4. Select **release** build variant
5. Click **Finish** — output: `android/app/release/app-release.aab`

---

## Step 6 — Create Google Play Developer account

1. Go to: https://play.google.com/console
2. Pay the **one-time $25 registration fee**
3. Accept the Developer Distribution Agreement

---

## Step 7 — Create the app on Play Console

1. Click **Create app**
2. Fill in:
   - **App name**: SkipTheApp
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free
3. Accept policies

---

## Step 8 — Fill the Store Listing

### Required assets

| Asset | Size | Notes |
|---|---|---|
| App icon | 512×512 PNG | Use `public/icons/icon-512.png` |
| Feature graphic | 1024×500 PNG | Create a banner image showing the app |
| Phone screenshots | Min 2, max 8 | Take screenshots from emulator/device |

### App details

**Short description** (80 chars max):
```
WhatsApp Dating — skip the small talk, connect directly for just $1.99
```

**Full description** (suggested):
```
SkipTheApp is a revolutionary dating app that cuts straight to real connection.

Browse profiles, swipe, and when you match — unlock their WhatsApp directly for just $1.99. No endless messaging. No ghosting. Just real conversations.

FEATURES:
• Smart profile discovery with swipe cards
• Interactive map — see who's nearby
• Super Likes to stand out from the crowd
• Voice intro — hear their voice before you meet
• VIP membership — 7 unlocks + 5 Super Likes/month
• New Profiles tab — see who just joined
• Available Tonight mode — show you're free
• First Date Places — share your favourite spots with Instagram links
• Verified profiles for safety

Dating made simple. Connect instantly.
```

---

## Step 9 — Content rating

In Play Console → **Content rating** → Start questionnaire:

- Category: **Dating**
- Select: contains mature/suggestive themes
- This will classify the app as **PEGI 18+ / Adults Only**

---

## Step 10 — Data safety declaration

In Play Console → **Data safety**, declare:

| Data type | Collected | Purpose |
|---|---|---|
| Name | Yes | Account functionality |
| Email address | Yes | Account functionality |
| Photos/videos | Yes | App functionality |
| Audio files | Yes | App functionality (voice intro) |
| Precise location | Yes | App functionality (map) |
| Financial info | Yes | In-app purchases (Stripe) |

Encryption: Yes (HTTPS/Supabase)
Deletion option: Yes (users can delete account)

---

## Step 11 — Upload the AAB and release

1. Go to **Release → Production → Create new release**
2. Upload `android/app/release/app-release.aab`
3. Write release notes (e.g. "Initial release — v1.0.0")
4. Click **Review release → Start rollout**

---

## Step 12 — Google Play review

- Review typically takes **1–3 days** for new apps
- Dating apps may receive additional review scrutiny
- You'll receive an email when approved or if action is needed

---

## Future updates workflow

Every time you update the app code:

```bash
# 1. Increment versionCode and versionName in android/app/build.gradle
# 2. Run:
npm run cap:build

# 3. In Android Studio: Build → Generate Signed Bundle
# 4. Upload new .aab to Play Console → Production → New release
```

---

## Important notes

- **Keep your keystore file safe** — if you lose it, you cannot update the app on Play Store
- **Stripe + Google Play Billing**: Google requires apps to use Google Play Billing for digital goods. Since payments go through Stripe (external), you should add a disclaimer in the Play Store listing that the in-app purchases are processed externally. Consult a lawyer for your region's compliance requirements.
- **Dating app policies**: Ensure you comply with Google's [Dating Apps policy](https://support.google.com/googleplay/android-developer/answer/9878810)
