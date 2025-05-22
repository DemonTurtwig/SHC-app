// plugins/fix-kotlin-version.js
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs').promises;
const path = require('path');

const TARGET_VERSION = '1.8.22';

module.exports = function (config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const file = path.join(
        cfg.modRequest.platformProjectRoot,
        'gradle.properties'
      );
      let contents = await fs.readFile(file, 'utf8');

      if (contents.includes('android.kotlinVersion')) {
        contents = contents.replace(
          /android\.kotlinVersion=.*/g,
          `android.kotlinVersion=${TARGET_VERSION}`
        );
      } else {
        contents += `\nandroid.kotlinVersion=${TARGET_VERSION}\n`;
      }

      await fs.writeFile(file, contents);
      return cfg;
    },
  ]);
};
