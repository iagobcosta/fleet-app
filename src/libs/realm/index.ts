import { createRealmContext } from "@realm/react"

import { Historic } from "./schemas/Historic"

export const { RealmProvider, useRealm, useObject, useQuery } =
  createRealmContext({
    schema: [Historic],
  })
