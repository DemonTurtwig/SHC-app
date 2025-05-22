// plugins/fix-kotlin-version.js
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs').promises;
const path = require('path');

const KOTLIN_VERSION = '1.8.22';

module.exports = function fixKotlin(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const buildGradlePath = path.join(cfg.modRequest.platformProjectRoot, 'build.gradle');
      let gradle = await fs.readFile(buildGradlePath, 'utf8');

      // Inject ext.kotlinVersion
      if (!gradle.includes('ext.kotlinVersion')) {
        gradle = gradle.replace(
          /buildscript\s*{/,
          `buildscript {\n    ext.kotlinVersion = '${KOTLIN_VERSION}'`
        );
      }

      // Ensure plugin line uses the variable
      gradle = gradle.replace(
        /classpath\(['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin.*['"]\)/g,
        `classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")`
      );

      await fs.writeFile(buildGradlePath, gradle);
      return cfg;
    },
  ]);
};
