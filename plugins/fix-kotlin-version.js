// plugins/fix-kotlin-version.js
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs').promises;
const path = require('path');

const KOTLIN_VERSION = '1.8.22';

module.exports = function fixKotlin(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const gradlePropsPath = path.join(cfg.modRequest.platformProjectRoot, 'gradle.properties');
      let gradleProps = await fs.readFile(gradlePropsPath, 'utf8');

      // Overwrite android.kotlinVersion
      if (gradleProps.includes('android.kotlinVersion')) {
        gradleProps = gradleProps.replace(/android\.kotlinVersion=.*/g, `android.kotlinVersion=${KOTLIN_VERSION}`);
      } else {
        gradleProps += `\nandroid.kotlinVersion=${KOTLIN_VERSION}`;
      }
      await fs.writeFile(gradlePropsPath, gradleProps);

      const buildGradlePath = path.join(cfg.modRequest.platformProjectRoot, 'build.gradle');
      let buildGradle = await fs.readFile(buildGradlePath, 'utf8');

      // Inject ext.kotlinVersion at top
      if (!buildGradle.includes('ext.kotlinVersion')) {
        buildGradle = buildGradle.replace(
          /buildscript\s*{/,
          `buildscript {\n    ext.kotlinVersion = '${KOTLIN_VERSION}'`
        );
      }

      // Fix the plugin classpath
      if (!buildGradle.includes('kotlin-gradle-plugin:$kotlinVersion')) {
        buildGradle = buildGradle.replace(
          /classpath\s*\(?["']org\.jetbrains\.kotlin:kotlin-gradle-plugin["']\)?/,
          `classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")`
        );
      }

      await fs.writeFile(buildGradlePath, buildGradle);
      return cfg;
    },
  ]);
};
