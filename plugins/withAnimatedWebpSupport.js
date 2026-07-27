// Expo's Android template only compiles in animated-gif / animated-webp
// support when these gradle.properties flags are set. They're needed for
// klipy stickers/gifs to actually render on Android; without
// expo.webp.animated=true, static webp shows fine but animated webp
// silently fails to decode (blank space, size still reserved).
const { createRunOncePlugin, withGradleProperties } = require('@expo/config-plugins');

const FLAGS = {
  'expo.gif.enabled': 'true',
  'expo.webp.enabled': 'true',
  'expo.webp.animated': 'true',
};

const withAnimatedWebpSupport = (config) =>
  withGradleProperties(config, (config) => {
    for (const [key, value] of Object.entries(FLAGS)) {
      config.modResults = config.modResults.filter(
        (item) => !(item.type === 'property' && item.key === key)
      );
      config.modResults.push({ type: 'property', key, value });
    }
    return config;
  });

module.exports = createRunOncePlugin(withAnimatedWebpSupport, 'animated-webp-support', '1.0.0');
