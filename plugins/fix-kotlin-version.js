// plugins/fix-kotlin-version.js
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs').promises;
const path = require('path');

const TARGET = '1.8.22';            // <— change here when you upgrade Kotlin

module.exports = function fixKotlin(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      /* ---------- gradle.properties ---------- */
      const propFile = path.join(
        cfg.modRequest.platformProjectRoot,
        'gradle.properties'
      );
      let props = await fs.readFile(propFile, 'utf8');

      // add or overwrite the property
      if (props.match(/android\.kotlinVersion=/)) {
        props = props.replace(/android\.kotlinVersion=.*/g,
                              `android.kotlinVersion=${TARGET}`);
      } else {
        props += `\nandroid.kotlinVersion=${TARGET}\n`;
      }
      await fs.writeFile(propFile, props);

      /* ---------- build.gradle (root) ---------- */
      const buildFile = path.join(
        cfg.modRequest.platformProjectRoot,
        'build.gradle'
      );
      let build = await fs.readFile(buildFile, 'utf8');

      // 1) remove any hard-coded 1.5.10 classpath
      build = build.replace(
        /classpath\s+['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin:1\.5\.10['"]\s*\n/gi,
        ''
      );

      // 2) ensure the variable version line is present exactly once
      if (!build.match(/kotlin-gradle-plugin:\$kotlinVersion/)) {
        build = build.replace(
          /classpath\s*\(\s*['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin['"]\s*\)/,
          `classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")`
        );
      }

      await fs.writeFile(buildFile, build);
      return cfg;
    },
  ]);
};
