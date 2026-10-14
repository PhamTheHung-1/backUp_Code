import type { ElysiaWithBaseUrl } from "elysia-autoload";
import type { App } from "./App";
import type Route0 from "./modules/user/user.routes";
import type Route1 from "./modules/role/role.routes";
import type Route2 from "./modules/org/org.routes";
import type Route3 from "./modules/menu/menu.routes";
import type Route4 from "./modules/auth/auth.routes";


    export type Routes = App & ElysiaWithBaseUrl<"/api/user", typeof Route0>
              & ElysiaWithBaseUrl<"/api/role", typeof Route1>
              & ElysiaWithBaseUrl<"/api/org", typeof Route2>
              & ElysiaWithBaseUrl<"/api/menu", typeof Route3>
              & ElysiaWithBaseUrl<"/api/auth", typeof Route4>
