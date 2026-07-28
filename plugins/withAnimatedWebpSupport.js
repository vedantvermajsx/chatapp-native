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
