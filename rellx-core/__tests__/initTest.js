import {
  createLightStore,
  createFullStore,
  loggerMiddleware,
} from "../dist/index.js";

const lightStore = createLightStore({ count: 0 });

lightStore.subscribe((state) => {
  console.log("Light Store Updated:", state);
});
lightStore.setState((prev) => ({ count: prev.count + 1 }));
lightStore.setState((prev) => ({ count: prev.count + 1 }));

const fullStore = createFullStore({ user: null });

fullStore.use(loggerMiddleware);
fullStore.subscribe((state) => {
  console.log("Full Store Updated:", state);
});
fullStore.setState(() => ({ user: "Admin" }));
