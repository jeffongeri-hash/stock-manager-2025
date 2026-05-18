import { loadFont as loadDM } from "@remotion/google-fonts/DMSans";
import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadJet } from "@remotion/google-fonts/JetBrainsMono";

export const body = loadDM("normal", { weights: ["400", "500", "700"], subsets: ["latin"] }).fontFamily;
export const display = loadCormorant("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily;
export const mono = loadJet("normal", { weights: ["500"], subsets: ["latin"] }).fontFamily;
