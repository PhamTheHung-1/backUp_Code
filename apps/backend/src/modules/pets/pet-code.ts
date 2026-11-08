const SPECIES_PREFIXES: Record<string, string> = {
	dog: "D",
	cho: "D",
	cat: "C",
	meo: "C",
	rabbit: "R",
	tho: "R",
	bird: "B",
	chim: "B",
	fish: "F",
	ca: "F",
	turtle: "T",
	rua: "T",
	hamster: "H",
	"guinea pig": "G",
	"bo u": "G",
};

export function getPetCodePrefix(species: string): string {
	const normalizedSpecies = species
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.trim()
		.toLocaleLowerCase("en");
	const knownPrefix = SPECIES_PREFIXES[normalizedSpecies];
	if (knownPrefix) return knownPrefix;

	const englishInitial = normalizedSpecies.match(/[a-z]/)?.[0];
	return englishInitial?.toLocaleUpperCase("en") ?? "P";
}

export function formatPetCode(prefix: string, sequence: number): string {
	return `${prefix}${String(sequence).padStart(2, "0")}`;
}
