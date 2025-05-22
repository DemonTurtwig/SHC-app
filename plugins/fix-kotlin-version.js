// plugins/fix-kotlin-version.js
const { withDangerousMod } = require('@expo/config-plugins');
const fs   = require('fs').promises;
const path = require('path');

const KOTLIN_VERSION = '2.0.21';

module.exports = function fixKotlinVersion(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const androidDir  = cfg.modRequest.platformProjectRoot;

      const rootPropsPath    = path.join(projectRoot, 'gradle.properties');
      const androidPropsPath = path.join(androidDir,  'gradle.properties');
      const buildGradlePath  = path.join(androidDir,  'build.gradle');

      /* 1️⃣  Copy root gradle.properties */
      let props = await fs.readFile(rootPropsPath, 'utf8');

      /* 2️⃣  Remove any android.kotlinVersion line */
      props = props.replace(/^\s*android\.kotlinVersion=.*\r?\n?/gim, '');

      /* 3️⃣  Ensure plain kotlinVersion is present */
      if (!/^kotlinVersion=/m.test(props)) {
        props += `\nkotlinVersion=${KOTLIN_VERSION}\n`;
      }

      await fs.writeFile(androidPropsPath, props);
      console.log('✔ gradle.properties copied & cleaned');

      /* 4️⃣  Patch build.gradle */
      let gradle = await fs.readFile(buildGradlePath, 'utf8');

      if (!gradle.includes('ext.kotlinVersion')) {
        gradle = gradle.replace(
          /buildscript\s*{/,
          `buildscript {\n    ext.kotlinVersion = '${KOTLIN_VERSION}'`
        );
      }

      gradle = gradle.replace(
        /classpath\(?["']org\.jetbrains\.kotlin:kotlin-gradle-plugin:[^"')]+["']\)?/g,
        `classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")`
      );

      await fs.writeFile(buildGradlePath, gradle);
      console.log('✔ build.gradle patched');

      return cfg;
    },
  ]);
};
