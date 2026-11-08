import { describe, expect, it } from "bun:test";
import { formatPetCode, getPetCodePrefix } from "./pet-code";

describe("pet display code generation", () => {
	it("maps English and Vietnamese dog and cat names to their English initials", () => {
		expect(getPetCodePrefix("Dog")).toBe("D");
		expect(getPetCodePrefix("Chó")).toBe("D");
		expect(getPetCodePrefix("Cat")).toBe("C");
		expect(getPetCodePrefix("Mèo")).toBe("C");
	});

	it("uses the first English letter for other English species", () => {
		expect(getPetCodePrefix("Rabbit")).toBe("R");
		expect(getPetCodePrefix("Hamster")).toBe("H");
	});

	it("formats a clinic sequence with at least two digits and expands beyond 99", () => {
		expect(formatPetCode("D", 1)).toBe("D01");
		expect(formatPetCode("C", 9)).toBe("C09");
		expect(formatPetCode("D", 100)).toBe("D100");
	});
});
