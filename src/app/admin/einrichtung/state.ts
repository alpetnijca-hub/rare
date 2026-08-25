/**
 * Zustand des Einrichtungsformulars.
 *
 * Bewusst in einer eigenen Datei ohne `"use server"`: Aus einem
 * Server-Actions-Modul dürfen ausschliesslich async-Funktionen exportiert
 * werden. Eine Konstante wie `idleSetupState` gehört deshalb hierher.
 */

export interface SetupState {
  ok: boolean;
  message?: string;
  fields?: Record<string, string>;
}

export const idleSetupState: SetupState = { ok: false };
