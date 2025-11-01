// import { PhoneAuthProvider, signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";
// import { auth } from "../lib/firebaseConfig";

// // Initialize reCAPTCHA verifier
// export const setupRecaptcha = (recaptchaRef) => {
//   if (!window.recaptchaVerifier) {
//     window.recaptchaVerifier = new RecaptchaVerifier(
//       recaptchaRef,
//       {
//         size: "invisible", // or "normal" to show the widget
//         callback: (response) => {
//           console.log("Recaptcha verified", response);
//         },
//       },
//       auth
//     );
//   }
// };

// export const sendPhoneVerification = async (phoneNumber) => {
//   const appVerifier = window.recaptchaVerifier;
//   return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
// };