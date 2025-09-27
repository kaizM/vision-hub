import { StoreHubKiosk } from "./StoreHubKiosk";

export function StoreHubApp() {
  // The new kiosk system handles all state management internally
  // No need for user session management at this level since:
  // - Kiosk is always accessible to everyone
  // - Personal tasks require PIN authentication when opened
  // - Admin functions are role-based within the kiosk

  return <StoreHubKiosk />;
}