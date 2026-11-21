import { describe, expect, it } from "vitest";

import { formatPhone, isValidWhatsApp, phoneDigits } from "./phone";

describe("WhatsApp obrigatório", () => {
  it("vazio não é aceito", () => {
    expect(isValidWhatsApp("")).toBe(false);
  });
  it("sem DDD não é aceito", () => {
    expect(isValidWhatsApp("99926-6351")).toBe(false);
  });
  it("celular com DDD é aceito", () => {
    expect(isValidWhatsApp("(91) 99926-6351")).toBe(true);
  });
  it("fixo com DDD é aceito", () => {
    expect(isValidWhatsApp("91 3222-1234")).toBe(true);
  });
  it("salva só os números", () => {
    expect(phoneDigits("(91) 99926-6351")).toBe("91999266351");
  });
  it("formata enquanto digita", () => {
    expect(formatPhone("91999266351")).toBe("(91) 99926-6351");
  });
});
