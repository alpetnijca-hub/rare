"use server";

import { cookies } from "next/headers";
import {
  currencies,
  currencyCookieMaxAge,
  currencyCookieName,
  resolveCurrency,
} from "@/config/currencies";

/**
 * Speichert die gewählte Anzeigewährung.
 *
 * Es wird ausschliesslich ein Code aus der serverseitigen Liste akzeptiert;
 * alles andere fällt still auf CHF zurück. Das Cookie steuert nur die
 * Darstellung – niemals einen Preis, einen Betrag oder eine Zahlung.
 */
export async function setDisplayCurrency(formData: FormData): Promise<void> {
  const submitted = formData.get("currency");
  const currency = resolveCurrency(
    typeof submitted === "string" ? submitted : null,
  );

  const store = await cookies();
  store.set(currencyCookieName, currency.code, {
    maxAge: currencyCookieMaxAge,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

/** Liste für den Umschalter – bewusst serverseitig erzeugt. */
export async function listCurrencies() {
  return currencies.map(({ code, label, isBase }) => ({ code, label, isBase }));
}
