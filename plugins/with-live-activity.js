const fs = require('fs');
const path = require('path');
const { withDangerousMod, withInfoPlist, withXcodeProject } = require('@expo/config-plugins');

const widgetTargetName = 'TrailMarkLiveActivity';
const widgetBundleIdentifier = 'com.synastrr.trailmark-app.live-activity';

function addWidgetTarget(config) {
  return withXcodeProject(config, (projectConfig) => {
    const project = projectConfig.modResults;
    const marketingVersion = config.version || '1.0.0';
    const buildNumber = config.ios?.buildNumber || '1';
    if (project.pbxTargetByName(widgetTargetName)) return projectConfig;

    project.hash.project.objects.PBXTargetDependency = project.hash.project.objects.PBXTargetDependency || {};
    project.hash.project.objects.PBXContainerItemProxy = project.hash.project.objects.PBXContainerItemProxy || {};
    const appTarget = project.getFirstTarget();
    const widget = project.addTarget(widgetTargetName, 'app_extension', 'TrailMarkLiveActivity', widgetBundleIdentifier);
    const widgetTarget = widget.pbxNativeTarget;

    if (!project.hasFile('TrailMarkLiveActivity/Assets.xcassets')) {
      project.addResourceFile('TrailMarkLiveActivity/Assets.xcassets', { target: widget.uuid });
    }

    project.addSourceFile('TrailMark/TrailMarkLiveActivityModule.swift', { target: appTarget.uuid });
    project.addSourceFile('TrailMark/TrailMarkLiveActivityBridge.m', { target: appTarget.uuid });
    const attributesFile = project.addSourceFile('TrailMark/TrailMarkLiveActivityAttributes.swift', { target: appTarget.uuid });

    const widgetSources = project.addBuildPhase(
      ['TrailMarkLiveActivity/TrailMarkLiveActivity.swift'],
      'PBXSourcesBuildPhase',
      'Sources',
      widget.uuid,
    );

    // xcodeproj cannot attach one PBXBuildFile object to two source phases.
    // The shared attributes file needs a distinct build-file record per target.
    const widgetAttributesBuildFileUuid = project.generateUuid();
    const buildFiles = project.pbxBuildFileSection();
    buildFiles[widgetAttributesBuildFileUuid] = {
      isa: 'PBXBuildFile',
      fileRef: attributesFile.fileRef,
      fileRef_comment: 'TrailMarkLiveActivityAttributes.swift',
    };
    buildFiles[`${widgetAttributesBuildFileUuid}_comment`] = 'TrailMarkLiveActivityAttributes.swift in Sources';
    project.hash.project.objects.PBXSourcesBuildPhase[widgetSources.uuid].files.push({
      value: widgetAttributesBuildFileUuid,
      comment: 'TrailMarkLiveActivityAttributes.swift in Sources',
    });
    project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', widget.uuid);
    project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', widget.uuid);

    const configurationList = project.pbxXCConfigurationList()[widgetTarget.buildConfigurationList];
    for (const entry of configurationList.buildConfigurations) {
      const configurationId = entry.value;
      if (!configurationId) continue;
      const configuration = project.pbxXCBuildConfigurationSection()[configurationId];
      configuration.buildSettings = {
        ...configuration.buildSettings,
        APPLICATION_EXTENSION_API_ONLY: 'YES',
        CLANG_ENABLE_MODULES: 'YES',
        DEVELOPMENT_TEAM: 'CAY3N8J725',
        INFOPLIST_FILE: 'TrailMarkLiveActivity/TrailMarkLiveActivity-Info.plist',
        IPHONEOS_DEPLOYMENT_TARGET: '16.4',
        PRODUCT_BUNDLE_IDENTIFIER: widgetBundleIdentifier,
        PRODUCT_NAME: widgetTargetName,
        SWIFT_VERSION: '5.0',
        TARGETED_DEVICE_FAMILY: '"1,2"',
        CODE_SIGN_STYLE: 'Automatic',
        CURRENT_PROJECT_VERSION: buildNumber,
        MARKETING_VERSION: marketingVersion,
      };
    }
    return projectConfig;
  });
}

function withLiveActivities(config) {
  config = withInfoPlist(config, (plistConfig) => {
    plistConfig.modResults.NSSupportsLiveActivities = true;
    return plistConfig;
  });
  config = withDangerousMod(config, ['ios', async (dangerousConfig) => {
    const plistPath = path.join(
      dangerousConfig.modRequest.platformProjectRoot,
      'TrailMarkLiveActivity',
      'TrailMarkLiveActivity-Info.plist',
    );
    fs.mkdirSync(path.dirname(plistPath), { recursive: true });
    const imageSetPath = path.join(dangerousConfig.modRequest.platformProjectRoot, 'TrailMarkLiveActivity', 'Assets.xcassets', 'grand-prismatic-overlook.imageset');
    fs.mkdirSync(imageSetPath, { recursive: true });
    fs.copyFileSync(
      path.join(dangerousConfig.modRequest.projectRoot, 'assets', 'trails', 'grand-prismatic', 'live-activity-overlook.jpg'),
      path.join(imageSetPath, 'grand-prismatic-overlook.jpg'),
    );
    fs.writeFileSync(path.join(imageSetPath, 'Contents.json'), JSON.stringify({
      images: [{ idiom: 'universal', filename: 'grand-prismatic-overlook.jpg', scale: '1x' }],
      info: { author: 'xcode', version: 1 },
    }, null, 2));
    fs.writeFileSync(plistPath, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
<key>CFBundleExecutable</key><string>$(EXECUTABLE_NAME)</string>
<key>CFBundleName</key><string>$(PRODUCT_NAME)</string>
<key>CFBundlePackageType</key><string>XPC!</string>
<key>CFBundleShortVersionString</key><string>$(MARKETING_VERSION)</string>
<key>CFBundleVersion</key><string>$(CURRENT_PROJECT_VERSION)</string>
<key>NSSupportsLiveActivities</key><true/>
<key>NSExtension</key><dict>
<key>NSExtensionPointIdentifier</key><string>com.apple.widgetkit-extension</string>
</dict>
</dict></plist>
`);
    return dangerousConfig;
  }]);
  return addWidgetTarget(config);
}

module.exports = withLiveActivities;
