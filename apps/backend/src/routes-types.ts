import type { ElysiaWithBaseUrl } from "elysia-autoload";
import type { App } from "./App";
import type Route0 from "./modules/user/user.routes";
import type Route1 from "./modules/staff/staff.routes";
import type Route2 from "./modules/role/role.routes";
import type Route3 from "./modules/pets/pets.routes";
import type Route4 from "./modules/owners/owners.routes";
import type Route5 from "./modules/org/org.routes";
import type Route6 from "./modules/menu/menu.routes";
import type Route7 from "./modules/clinic-context/clinic-context.routes";
import type Route8 from "./modules/auth/auth.routes";
import type Route9 from "./modules/appointments/appointments.routes";


    export type Routes = App & ElysiaWithBaseUrl<"/api/user", typeof Route0>
              & ElysiaWithBaseUrl<"/api/staff", typeof Route1>
              & ElysiaWithBaseUrl<"/api/role", typeof Route2>
              & ElysiaWithBaseUrl<"/api/pets", typeof Route3>
              & ElysiaWithBaseUrl<"/api/owners", typeof Route4>
              & ElysiaWithBaseUrl<"/api/org", typeof Route5>
              & ElysiaWithBaseUrl<"/api/menu", typeof Route6>
              & ElysiaWithBaseUrl<"/api/clinic-context", typeof Route7>
              & ElysiaWithBaseUrl<"/api/auth", typeof Route8>
              & ElysiaWithBaseUrl<"/api/appointments", typeof Route9>
