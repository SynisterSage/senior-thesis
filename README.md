# TrailMark app

React Native + Expo + TypeScript prototype for TrailMark: a memory-focused hiking experience built around a small screenless physical companion called **Nod**.

TrailMark helps someone prepare for a trail, mark moments without taking out their phone, and reconstruct what those moments meant afterward. Nod is the product focus; the phone app gives each mark place, context, and a way to revisit it.

The current prototype centers on one prepared trail, Grand Prismatic Overlook in Yellowstone. The map flow, phone fallback, sequential demo marks, trail context pins, reflection direction, and archive direction are being developed before broader trail discovery or hardware production work.

See [product direction and MVP status](docs/PRODUCT_DIRECTION.md) for the current scope, decisions, guardrails, and phase plan.

See the [stack decision](../trailmark-idea/08-stack-and-build-plan.md) and [current concept](../trailmark-idea/00-current-writeup.md).

The eventual Bluetooth and locked-phone location flow requires a development build on a physical phone. Expo Go and a browser preview can help with early UI work but cannot validate the wearable.

First technical hardware milestone: create a mark from a real Nod button event while the phone is locked, save a timestamp and phone location locally, and acknowledge the successful save.

## Expo starter instructions

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
