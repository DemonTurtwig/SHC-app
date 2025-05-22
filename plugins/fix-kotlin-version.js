// plugins/fix-kotlin-version.js
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs').promises;
const path = require('path');

const KOTLIN_VERSION = '1.8.22';

module.exports = function fixKotlinVersion(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const gradlePropsPath = path.join(cfg.modRequest.projectRoot, 'android', 'gradle.properties');
      let props = await fs.readFile(gradlePropsPath, 'utf8');

      const regex = /^kotlinVersion=.*$/m;
      if (regex.test(props)) {
        props = props.replace(regex, `kotlinVersion=${KOTLIN_VERSION}`);
      } else {
        props += `\nkotlinVersion=${KOTLIN_VERSION}\n`;
      }

      await fs.writeFile(gradlePropsPath, props);
      return cfg;
    },
  ]);
};
  
      // ✅ Copy root gradle.properties to android/gradle.properties
      try {
        const rootProps = await fs.readFile(rootGradlePropsPath, 'utf8');
        await fs.writeFile(androidGradlePropsPath, rootProps);
        console.log('✔ Copied root gradle.properties to android/');
      } catch (err) {
        console.warn('⚠ Failed to copy root gradle.properties:', err);
      }

      // ✅ Inject ext.kotlinVersion if not present
      try {
        let gradle = await fs.readFile(buildGradlePath, 'utf8');

        if (!gradle.includes('ext.kotlinVersion')) {
          gradle = gradle.replace(
            /buildscript\s*{/,
            `buildscript {\n    ext.kotlinVersion = '${KOTLIN_VERSION}'`
          );
        }

        // Ensure classpath uses the variable, not hardcoded version
        gradle = gradle.replace(
          /classpath\(['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin.*?['"]\)/g,
          `classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")`
        );

        await fs.writeFile(buildGradlePath, gradle);
        console.log('✔ Patched build.gradle with ext.kotlinVersion');
      } catch (err) {
        console.warn('⚠ Failed to patch build.gradle:', err);
      }

      return cfg;