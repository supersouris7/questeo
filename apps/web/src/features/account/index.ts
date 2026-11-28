/**
 * Fonctionnalité « account » (compte familial) : connexion, inscription, mot de passe oublié,
 * garde des pages connectées, verrou parent. API publique de la fonctionnalité.
 */
export {
  ForgotPasswordScreen,
  HiddenInRecette,
  LoginScreen,
  RequireAccount,
  ResetPasswordScreen,
  SignupScreen,
  VerifyEmailScreen,
} from './AuthScreens.tsx';
export {
  StudentAgeScreen,
  StudentRecoverScreen,
  StudentSignupScreen,
  StudentSpace,
  WelcomeScreen,
} from './StudentScreens.tsx';
export { joinFamily } from './api.ts';
export { ParentGateProvider } from './ParentGate.tsx';
export { PortalSignIn } from './portal.tsx';
export { useParentGate } from './parentGate.ts';
export { SignOutButton } from './SignOutButton.tsx';
export { deleteFamily, exportFamily, lockParent, setParentPin, useMe, useSetMe } from './api.ts';
export { ParentUnlock } from './ParentUnlock.tsx';
export { useSessionSync } from './sessionCache.ts';
