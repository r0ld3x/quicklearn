import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const sidebarCollapsedAtom = atomWithStorage("sidebar-collapsed", false);

export const searchQueryAtom = atom("");

export const mobileNavOpenAtom = atom(false);
