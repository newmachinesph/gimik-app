/**
 * Whether the person in front of the app has agreed to the terms this session.
 *
 * App Store guideline 1.2 wants the agreement before anyone registers or signs
 * in. The checkbox is on the welcome screen, but a `gimik://sign-in` or
 * `gimik://onboarding` link opens those screens without passing it - so they
 * ask this, and send anyone who has not agreed back to the door.
 *
 * Held in memory on purpose: it is asked again on every cold start that ends
 * at the welcome screen, which is every time somebody is signed out.
 */
let agreed = false;

export const termsAgreed = (): boolean => agreed;
export const setTermsAgreed = (value: boolean): void => { agreed = value; };
