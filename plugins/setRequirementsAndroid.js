const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withRequiredFeatures(config) {
  return withAndroidManifest(config, config => {
    const usesFeatures = [
      {
        $: {
          'android:name': 'android.hardware.telephony',
          'android:required': 'true',
        },
      },
      {
        $: {
          'android:name': 'android.hardware.type.watch',
          'android:required': 'false',
        },
      },
      {
        $: {
          'android:name': 'android.hardware.camera',
          'android:required': 'false',
        },
      },
      {
        $: {
          'android:name': 'android.hardware.camera.autofocus',
          'android:required': 'false',
        },
      },
    ];

    if (!config.modResults.manifest['uses-feature']) {
      config.modResults.manifest['uses-feature'] = [];
    }

    config.modResults.manifest['uses-feature'].push(...usesFeatures);

    return config;
  });
};
