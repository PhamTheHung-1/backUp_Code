import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type ClinicStore = {
	activeClinicId: number | null;
	userId: string | null;
	setActiveClinic: (clinicId: number | null, userId: string | null) => void;
	clearActiveClinic: () => void;
};

const useClinicStore = create<ClinicStore>()(
	persist(
		set => ({
			activeClinicId: null,
			userId: null,
			setActiveClinic: (activeClinicId, userId) => set({ activeClinicId, userId }),
			clearActiveClinic: () => set({ activeClinicId: null, userId: null }),
		}),
		{
			name: "clinicContext",
			storage: createJSONStorage(() => localStorage),
			partialize: ({ activeClinicId, userId }) => ({ activeClinicId, userId }),
		},
	),
);

export const useActiveClinicId = () => useClinicStore(state => state.activeClinicId);
export const useClinicActions = () => useClinicStore(state => state);

export default useClinicStore;
