import { describe, expect, it } from "vitest";
import { registerSchema, loginSchema } from "@/validations/auth.validations";

describe("registerSchema", () => {
  it("accepts a valid payload and normalizes the email", () => {
    const parsed = registerSchema.parse({
      email: "  Jane@Example.com ",
      password: "supersecret123",
      fullName: "Jane Doe",
    });
    expect(parsed.email).toBe("jane@example.com");
  });

  it("rejects a short password", () => {
    expect(() =>
      registerSchema.parse({
        email: "jane@example.com",
        password: "short",
        fullName: "Jane Doe",
      })
    ).toThrow();
  });
});

describe("loginSchema", () => {
  it("rejects a missing password", () => {
    expect(() =>
      loginSchema.parse({ email: "jane@example.com", password: "" })
    ).toThrow();
  });
});
