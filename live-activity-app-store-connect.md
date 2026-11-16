# Live Activity and App Store Connect

## Do I need to configure App Store Connect now?

No—not for the current local iPhone build.

For local development, no App Store Connect setup is required. The app can be installed directly through Xcode with automatic signing.

## When TestFlight is ready

You will need:

- An App Store Connect app record for `com.synastrr.trailmark-app`.
- A submitted build uploaded through Xcode or EAS.
- Automatic signing enabled for the new Live Activity extension.

The Live Activity does **not** need to be created as a separate App Store Connect app. Its extension bundle identifier is:

`com.synastrr.trailmark-app.live-activity`

The TestFlight build will run independently on the iPhone and will not depend on Metro, Expo’s development server, the laptop, or a QR code.
