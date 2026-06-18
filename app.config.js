/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    name: 'SnapChef',
    slug: appJson.expo.slug,
    orientation: 'default',
    plugins: [...(appJson.expo.plugins ?? []), 'expo-web-browser', 'expo-video', 'expo-audio'],
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID ?? '01237313-53c8-42cc-be6d-f8ffe51d2620',
      },
    },
  },
};
